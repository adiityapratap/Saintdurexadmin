"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Edit, Mail, Phone, MapPin, Building2, User } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import Link from "next/link"

interface Customer {
    customer_id: number
    firstname: string
    lastname: string
    email: string
    telephone: string
    customer_address: string
    customer_type: string
    customer_cost_centre?: string
    customer_notes?: string
    customer_image?: string
    customer_postcode?: string
    customer_suburb?: string
    customer_state?: string
    customer_country?: string
    company_id?: number
    company_name?: string
    department_id?: number
    department_name?: string
    date_added?: string
    status?: number
}

export default function CustomerDetailPage() {
    const router = useRouter()
    const params = useParams()
    const customerId = params.id as string

    // Fetch customer data
    const { data: customerData, isLoading } = useQuery({
        queryKey: ["customer", customerId],
        queryFn: async () => {
            const response = await api.get(`/admin/customers/${customerId}`)
            return response.data.customer
        },
        enabled: !!customerId,
    })

    if (isLoading) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center" style={{ fontFamily: 'Albert Sans' }}>
                <div className="text-center">
                    <p className="text-gray-600">Loading customer details...</p>
                </div>
            </div>
        )
    }

    if (!customerData) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center" style={{ fontFamily: 'Albert Sans' }}>
                <div className="text-center">
                    <p className="text-red-600 mb-4">Customer not found</p>
                    <Button onClick={() => router.push("/customers")}>Back to Customers</Button>
                </div>
            </div>
        )
    }

    const customer = customerData as Customer

    return (
        <div className="bg-gray-50 min-h-screen" style={{ fontFamily: 'Albert Sans' }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <ChevronLeft className="h-6 w-6 text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontWeight: 700 }}>
                            Customer Details
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            {customer.firstname} {customer.lastname}
                        </p>
                    </div>
                </div>
                {/* <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/customers?edit=${customerId}`)}
                        className="gap-2 border-gray-300 bg-white"
                        style={{ fontFamily: 'Albert Sans', fontWeight: 600 }}
                    >
                        <Edit className="h-4 w-4" />
                        Edit Customer
                    </Button>
                </div> */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Customer Information */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Information */}
                    <Card className="border border-gray-200 shadow-sm bg-white p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Albert Sans' }}>
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                    First Name
                                </label>
                                <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Albert Sans' }}>
                                    {customer.firstname}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                    Last Name
                                </label>
                                <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Albert Sans' }}>
                                    {customer.lastname}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                    Email
                                </label>
                                <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Albert Sans' }}>
                                    {customer.email}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                    Phone
                                </label>
                                <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Albert Sans' }}>
                                    {customer.telephone}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                    Customer Type
                                </label>
                                <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Albert Sans' }}>
                                    {customer.customer_type || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Address Information */}
                    <Card className="border border-gray-200 shadow-sm bg-white p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Albert Sans' }}>
                            Address Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                    Address
                                </label>
                                <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Albert Sans' }}>
                                    {customer.customer_address || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                    Suburb
                                </label>
                                <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Albert Sans' }}>
                                    {customer.customer_suburb || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                    Postcode
                                </label>
                                <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Albert Sans' }}>
                                    {customer.customer_postcode || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                    State
                                </label>
                                <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Albert Sans' }}>
                                    {customer.customer_state || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                    Country
                                </label>
                                <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Albert Sans' }}>
                                    {customer.customer_country || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Company & Department */}
                    {(customer.company_name || customer.department_name) && (
                        <Card className="border border-gray-200 shadow-sm bg-white p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Albert Sans' }}>
                                Company & Department
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {customer.company_name && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                            Company
                                        </label>
                                        <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Albert Sans' }}>
                                            {customer.company_name}
                                        </p>
                                    </div>
                                )}
                                {customer.department_name && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                            Department
                                        </label>
                                        <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Albert Sans' }}>
                                            {customer.department_name}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Notes */}
                    {customer.customer_notes && (
                        <Card className="border border-gray-200 shadow-sm bg-white p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Albert Sans' }}>
                                Notes
                            </h3>
                            <p className="text-sm text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                {customer.customer_notes}
                            </p>
                        </Card>
                    )}
                </div>

                {/* Right Panel - Quick Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Contact Card */}
                    <Card className="border border-gray-200 shadow-sm bg-white p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Albert Sans' }}>
                            Contact Information
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Albert Sans' }}>Email</p>
                                    <a
                                        href={`mailto:${customer.email}`}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                        style={{ fontFamily: 'Albert Sans' }}
                                    >
                                        {customer.email}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Albert Sans' }}>Phone</p>
                                    <a
                                        href={`tel:${customer.telephone}`}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                        style={{ fontFamily: 'Albert Sans' }}
                                    >
                                        {customer.telephone}
                                    </a>
                                </div>
                            </div>
                            {customer.customer_address && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500" style={{ fontFamily: 'Albert Sans' }}>Address</p>
                                        <p className="text-sm text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                            {customer.customer_address}
                                            {customer.customer_suburb && `, ${customer.customer_suburb}`}
                                            {customer.customer_postcode && ` ${customer.customer_postcode}`}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Additional Info */}
                    {customer.customer_cost_centre && (
                        <Card className="border border-gray-200 shadow-sm bg-white p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Albert Sans' }}>
                                Additional Information
                            </h3>
                            <div>
                                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Albert Sans' }}>
                                    Cost Centre
                                </label>
                                <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Albert Sans' }}>
                                    {customer.customer_cost_centre}
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
