"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { paymentsAPI, ordersAPI } from "@/lib/api"
import { CreditCard, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

interface PaymentProcessingModalProps {
  orderId: number
  onSuccess: () => void
  onClose: () => void
}

function StripePaymentForm({ orderId, orderTotal, onSuccess }: { orderId: number; orderTotal: number; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    // Create payment intent when component mounts
    const createIntent = async () => {
      try {
        const response = await paymentsAPI.createIntent({
          order_id: orderId,
        })

        if (response.data.success && response.data.client_secret) {
          setClientSecret(response.data.client_secret)
        } else {
          toast.error(response.data.message || "Failed to initialize payment")
        }
      } catch (error: any) {
        console.error("Payment intent error:", error)
        toast.error(error.response?.data?.message || "Failed to initialize payment. Please try again.")
      }
    }

    createIntent()
  }, [orderId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setProcessing(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/orders/${orderId}`,
        },
        redirect: 'if_required',
      })

      if (error) {
        toast.error(error.message || "Payment failed")
        setProcessing(false)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Verify payment on backend
        await paymentsAPI.verify({
          payment_intent_id: paymentIntent.id,
          order_id: orderId,
        })

        toast.success("Payment processed successfully!")
        onSuccess()
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      toast.error(error.response?.data?.message || "Payment processing failed. Please try again.")
      setProcessing(false)
    }
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4" />
        <p>Initializing payment...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full"
        disabled={processing || !stripe}
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay ${Number.parseFloat(orderTotal.toString()).toFixed(2)}
          </>
        )}
      </Button>
    </form>
  )
}

export function PaymentProcessingModal({ orderId, onSuccess, onClose }: PaymentProcessingModalProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("process")

  // Fetch order details
  const { data: orderData } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      try {
        const response = await ordersAPI.get(orderId)
        return response.data || {}
      } catch (error) {
        console.error("Error fetching order:", error)
        return {}
      }
    },
    enabled: !!orderId,
  })

  // Fetch payment history
  const { data: paymentHistoryData, refetch: refetchPaymentHistory } = useQuery({
    queryKey: ['payment-history', orderId],
    queryFn: async () => {
      try {
        const response = await paymentsAPI.getOrderHistory(orderId)
        return response.data || { payments: [] }
      } catch (error) {
        console.error("Error fetching payment history:", error)
        return { payments: [] }
      }
    },
    enabled: !!orderId,
  })

  const order = orderData?.order
  const paymentHistory = paymentHistoryData?.payments || []

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (data: { id: number; status: number }) => {
      return await ordersAPI.updateStatus(data.id, data.status)
    },
    onSuccess: () => {
      toast.success("Order marked as paid")
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to mark order as paid")
    },
  })

  const handleMarkAsPaid = () => {
    if (!orderId) return
    markAsPaidMutation.mutate({ id: orderId, status: 2 })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Succeeded</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount)
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="py-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600 text-center">Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="py-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="process">Process Payment</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        {/* Process Payment Tab */}
        <TabsContent value="process" className="space-y-4">
          {order && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Order Total</Label>
                    <span className="text-lg font-bold">{formatCurrency(parseFloat(order.order_total || 0))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Order Status</Label>
                    <Badge variant={order.order_status === 2 ? "default" : "secondary"}>
                      {order.order_status === 2 ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>
                  {order.payment_status && (
                    <div className="flex justify-between items-center">
                      <Label>Payment Status</Label>
                      <Badge>{order.payment_status}</Badge>
                    </div>
                  )}
                  {order.payment_gateway && (
                    <div className="flex justify-between items-center">
                      <Label>Payment Gateway</Label>
                      <Badge>{order.payment_gateway}</Badge>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    {order.order_status === 2 ? (
                      <p className="text-sm text-green-600 text-center py-4">
                        This order has already been paid.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mb-4">
                          Process payment using Stripe or mark the order as paid manually.
                        </p>
                        <Elements stripe={stripePromise} options={{ appearance: { theme: 'stripe' } }}>
                          <StripePaymentForm 
                            orderId={orderId}
                            orderTotal={parseFloat(order.order_total || 0)}
                            onSuccess={() => {
                              queryClient.invalidateQueries({ queryKey: ['order', orderId] })
                              queryClient.invalidateQueries({ queryKey: ['payment-history', orderId] })
                              refetchPaymentHistory()
                              onSuccess()
                            }}
                          />
                        </Elements>
                        <div className="mt-4 pt-4 border-t">
                          <Button
                            onClick={handleMarkAsPaid}
                            disabled={markAsPaidMutation.isPending}
                            variant="outline"
                            className="w-full"
                          >
                            {markAsPaidMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Mark as Paid (Manual)
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-4">
          {paymentHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 text-center py-4">
                  No payment history found for this order.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {paymentHistory.map((payment: any) => (
                <Card key={payment.payment_history_id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium">Transaction ID</p>
                          {getStatusBadge(payment.payment_status)}
                        </div>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded block mb-2">
                          {payment.payment_transaction_id}
                        </code>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Gateway:</span> {payment.payment_gateway}
                          </div>
                          <div>
                            <span className="text-gray-600">Method:</span> {payment.payment_method || 'N/A'}
                          </div>
                          <div>
                            <span className="text-gray-600">Amount:</span> {formatCurrency(parseFloat(payment.amount || 0))}
                          </div>
                          {payment.refund_amount > 0 && (
                            <div>
                              <span className="text-gray-600">Refunded:</span>{" "}
                              <span className="text-red-600">{formatCurrency(parseFloat(payment.refund_amount || 0))}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Date:</span> {new Date(payment.created_at).toLocaleString()}
                          </div>
                          {payment.card_last4 && (
                            <div>
                              <span className="text-gray-600">Card:</span> •••• {payment.card_last4}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
