"use client"

import { useState, useEffect, useCallback } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Plus, Trash2, Check, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

interface PaymentMethodsProps {
  userId: string
  userEmail: string
  userName?: string
}

function AddPaymentMethodForm({ 
  onSuccess, 
  onCancel 
}: { 
  onSuccess: () => void
  onCancel: () => void 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error: submitError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/settings?payment=success`,
        },
        redirect: "if_required",
      })

      if (submitError) {
        setError(submitError.message || "Failed to add payment method")
        toast({
          title: "Error",
          description: submitError.message || "Failed to add payment method",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Payment method added successfully",
        })
        onSuccess()
      }
    } catch (err) {
      setError("An unexpected error occurred")
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isLoading} className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Payment Method"
          )}
        </Button>
      </div>
    </form>
  )
}

export function PaymentMethods({ userId, userEmail, userName }: PaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await fetch(`/api/payments/payment-methods?userId=${userId}`)
      const data = await response.json()
      
      if (response.ok) {
        setPaymentMethods(data.paymentMethods || [])
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchPaymentMethods()
  }, [fetchPaymentMethods])

  const handleAddNew = async () => {
    try {
      const response = await fetch("/api/payments/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email: userEmail, name: userName }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.clientSecret) {
        setClientSecret(data.clientSecret)
        setIsAddingNew(true)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to initialize payment setup",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize payment setup",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (paymentMethodId: string) => {
    setDeletingId(paymentMethodId)
    try {
      const response = await fetch(`/api/payments/payment-methods?userId=${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId }),
      })
      
      if (response.ok) {
        setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId))
        toast({
          title: "Success",
          description: "Payment method removed",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to remove payment method",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove payment method",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (paymentMethodId: string) => {
    setSettingDefaultId(paymentMethodId)
    try {
      const response = await fetch("/api/payments/payment-methods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, paymentMethodId }),
      })
      
      if (response.ok) {
        setPaymentMethods(prev => prev.map(pm => ({
          ...pm,
          isDefault: pm.id === paymentMethodId
        })))
        toast({
          title: "Success",
          description: "Default payment method updated",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to set default payment method",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set default payment method",
        variant: "destructive",
      })
    } finally {
      setSettingDefaultId(null)
    }
  }

  const handleSuccess = () => {
    setIsAddingNew(false)
    setClientSecret(null)
    fetchPaymentMethods()
  }

  const handleCancel = () => {
    setIsAddingNew(false)
    setClientSecret(null)
  }

  const getBrandIcon = (brand: string) => {
    // You could add specific brand icons here
    return <CreditCard className="h-6 w-6 text-muted-foreground" />
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Manage your payment methods for booking lessons</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingNew && clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#8B5A2B",
                },
              },
            }}
          >
            <AddPaymentMethodForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </Elements>
        ) : (
          <>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No payment methods added yet</p>
                <Button onClick={handleAddNew} className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Payment Method
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        method.isDefault ? "border-[#8B5A2B] bg-[#8B5A2B]/5" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {getBrandIcon(method.brand)}
                        <div>
                          <p className="font-medium capitalize">
                            {method.brand} ending in {method.last4}
                            {method.isDefault && (
                              <span className="ml-2 text-xs bg-[#8B5A2B] text-white px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires {method.expMonth.toString().padStart(2, "0")}/{method.expYear}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(method.id)}
                            disabled={settingDefaultId === method.id}
                          >
                            {settingDefaultId === method.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="mr-1 h-4 w-4" />
                                Set Default
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(method.id)}
                          disabled={deletingId === method.id}
                          className="text-destructive hover:text-destructive"
                        >
                          {deletingId === method.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={handleAddNew} variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Payment Method
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
