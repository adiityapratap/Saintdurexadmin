"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { ordersAPI } from "@/lib/api"
import { toast } from "sonner"
import { CheckCircle2, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

function PaymentForm({ orderId, orderTotal, onSuccess }: { orderId: string; orderTotal: number; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    // Create payment intent when component mounts
    const createIntent = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/store/payment/create-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: parseInt(orderId),
          }),
        })

        const data = await response.json()

        if (data.success && data.client_secret) {
          setClientSecret(data.client_secret)
        } else {
          toast.error(data.message || "Failed to initialize payment")
        }
      } catch (error: any) {
        console.error("Payment intent error:", error)
        toast.error("Failed to initialize payment. Please try again.")
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
          return_url: `${window.location.origin}/payment/success?payment_intent_id={PAYMENT_INTENT_ID}&order_id=${orderId}`,
        },
        redirect: 'if_required',
      })

      if (error) {
        toast.error(error.message || "Payment failed")
        setProcessing(false)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Verify payment on backend
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/store/payment/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id,
            order_id: parseInt(orderId),
          }),
        })

        toast.success("Payment processed successfully!")
        onSuccess()
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      toast.error(error.message || "Payment processing failed. Please try again.")
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
        size="lg"
        disabled={processing || !stripe}
      >
        {processing ? "Processing Payment..." : `Pay $${Number.parseFloat(orderTotal.toString()).toFixed(2)}`}
      </Button>
    </form>
  )
}

function PaymentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Fetch order details
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null
      const response = await ordersAPI.get(parseInt(orderId))
      return response.data
    },
    enabled: !!orderId,
  })

  const order = orderData?.order

  useEffect(() => {
    if (!orderId) {
      toast.error("Order ID is required")
      router.push("/orders")
      return
    }
  }, [orderId, router])

  if (paymentSuccess) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-3xl font-bold mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Payment has been processed successfully for order #{orderId}.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push(`/orders/${orderId}`)}>
                View Order
              </Button>
              <Button variant="outline" onClick={() => router.push("/orders")}>
                Back to Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-16 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4" />
            <p>Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-8 text-center">
            <p className="text-red-600">Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/orders/${orderId}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Order
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Process Payment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ appearance: { theme: 'stripe' } }}>
                <PaymentForm 
                  orderId={orderId || ''} 
                  orderTotal={parseFloat(order?.order_total || 0)}
                  onSuccess={() => {
                    setPaymentSuccess(true)
                    setTimeout(() => {
                      router.push(`/orders/${orderId}`)
                    }, 2000)
                  }}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Order ID</span>
                    <span className="font-medium">#{order.order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge variant={order.order_status === 2 ? "default" : "secondary"}>
                      {order.order_status === 2 ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${Number.parseFloat(order.subtotal || order.order_total || "0").toFixed(2)}</span>
                  </div>
                  {(order.wholesale_discount && order.wholesale_discount > 0) && (
                    <div className="flex justify-between text-green-600">
                      <span>Wholesale Discount</span>
                      <span>-${Number.parseFloat(order.wholesale_discount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(order.coupon_discount && order.coupon_discount > 0) && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                      <span>-${Number.parseFloat(order.coupon_discount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${Number.parseFloat(order.delivery_fee || "0").toFixed(2)}</span>
                  </div>
                  {(order.gst && order.gst > 0) && (
                    <div className="flex justify-between">
                      <span>GST (10%)</span>
                      <span>${Number.parseFloat(order.gst || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${Number.parseFloat(order.calculated_total || order.order_total || "0").toFixed(2)}</span>
                    </div>
                  </div>
                  {order.customer_order_name && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-xs text-gray-500 mb-1">Customer</p>
                      <p className="font-medium">{order.customer_order_name}</p>
                      {order.customer_order_email && (
                        <p className="text-xs text-gray-500">{order.customer_order_email}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Loading order details...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <PaymentPageContent />
    </Suspense>
  )
}
