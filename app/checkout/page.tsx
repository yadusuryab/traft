// app/checkout/page.tsx
"use client";
import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { checkoutSchema } from "@/lib/validations";
import { QRCodeCanvas } from "qrcode.react";
import {
  Loader2,
  InfoIcon,
  Truck,
  CreditCard,
  Scan,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type CartItem = {
  _id: string;
  name: string;
  salesPrice: number;
  cartQty: number;
  size?: string | null;
  color?: string | null;
  image: string;
};

type FormData = z.infer<typeof checkoutSchema>;

type PendingOrderData = {
  formData: FormData;
  cart: CartItem[];
  total: number;
  paymentMethod: "online" | "cod";
  timestamp: number;
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [hasCompletedPayment, setHasCompletedPayment] = useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(checkoutSchema),
  });

  // Load cart and restore pending order on mount
  useEffect(() => {
    const loadCart = () => {
      const cartData = JSON.parse(localStorage.getItem("cart") || "[]");
      setCart(cartData);
      return cartData;
    };

    const restorePendingOrder = () => {
      const pendingOrderStr = localStorage.getItem("pendingOrder");
      if (pendingOrderStr) {
        try {
          const pendingOrder: PendingOrderData = JSON.parse(pendingOrderStr);
          
          // Check if order is older than 1 hour (optional: clear stale orders)
          const oneHourAgo = Date.now() - 60 * 60 * 1000;
          if (pendingOrder.timestamp < oneHourAgo) {
            localStorage.removeItem("pendingOrder");
            localStorage.removeItem("checkoutState");
            return null;
          }

          // Restore form data
          if (pendingOrder.formData) {
            reset(pendingOrder.formData);
            setFormData(pendingOrder.formData);
          }

          // Restore payment state
          const checkoutStateStr = localStorage.getItem("checkoutState");
          if (checkoutStateStr) {
            const checkoutState = JSON.parse(checkoutStateStr);
            setShowPayment(checkoutState.showPayment || false);
            setPaymentMethod(checkoutState.paymentMethod || "online");
            setTransactionId(checkoutState.transactionId || "");
            
            if (checkoutState.showPayment) {
              const amount = checkoutState.paymentMethod === "online" 
                ? pendingOrder.total 
                : 100;
              setQrCodeValue(generateUpiLink(amount));
            }
          }

          return pendingOrder;
        } catch (error) {
          console.error("Error restoring pending order:", error);
          clearCheckoutState();
        }
      }
      return null;
    };

    loadCart();
    restorePendingOrder();
    setIsRestoring(false);
  }, [reset]);

  // Save checkout state to localStorage when it changes
  useEffect(() => {
    if (isRestoring) return;
    
    const saveCheckoutState = () => {
      const checkoutState = {
        showPayment,
        paymentMethod,
        transactionId,
        timestamp: Date.now(),
      };
      localStorage.setItem("checkoutState", JSON.stringify(checkoutState));
    };

    saveCheckoutState();
  }, [showPayment, paymentMethod, transactionId, isRestoring]);

  useEffect(() => {
    if (paymentMethod === "online") {
      setShippingCharges(0); // free shipping
      setDeliveryTime("Kerala: 2-3 days | Outside Kerala: 6-7 days");
    } else {
      setShippingCharges(100); // COD extra
      setDeliveryTime("Delivery in 7 days");
    }
  }, [paymentMethod]);

  const subtotal = cart.reduce(
    (acc, item) => acc + item.salesPrice * item.cartQty,
    0
  );
  const total = subtotal + shippingCharges;

  const generateUpiLink = (amount: number) => {
    const upiId = process.env.NEXT_PUBLIC_UPI_ID;
    const note = `Payment for order`;
    return `upi://pay?pa=${upiId}&pn=${process.env.NEXT_PUBLIC_APP_NAME}&am=${amount}&tn=${note}`;
  };

  const clearCheckoutState = () => {
    localStorage.removeItem("checkoutState");
    localStorage.removeItem("pendingOrder");
  };

  const handleOrder = async (data: FormData) => {
    const paymentAmount = paymentMethod === "online" ? total : 100;

    if (!showPayment) {
      setQrCodeValue(generateUpiLink(paymentAmount));
      
      // Save form data and cart to localStorage
      const pendingOrder: PendingOrderData = {
        formData: data,
        cart,
        total,
        paymentMethod,
        timestamp: Date.now(),
      };
      localStorage.setItem("pendingOrder", JSON.stringify(pendingOrder));
      
      setShowPayment(true);
      window.scrollTo(0, 0);
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        ...data,
        products: cart.map((p) => ({
          product: p._id,
          quantity: p.cartQty,
          size: p.size || null,
          color: p.color || null,
        })),
        paymentMode: paymentMethod,
        shippingCharges,
        totalAmount: total,
        advanceAmount: paymentMethod === "cod" ? 100 : total,
        codRemaining: paymentMethod === "cod" ? total - 100 : 0,
        paymentStatus: true,
        transactionId,
      };

      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error("Failed to create order");

      const respdata = await response.json();
      
      // Clear all stored data on success
      clearCheckoutState();
      localStorage.removeItem("cart");
      
      router.push(`/order/${respdata.orderId}`);
    } catch (error) {
      toast.error("Failed to place order. Please try again.");
      console.error("Order error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openUpiApp = () => {
    // Save state before leaving the site
    const checkoutState = {
      showPayment: true,
      paymentMethod,
      transactionId,
      timestamp: Date.now(),
    };
    localStorage.setItem("checkoutState", JSON.stringify(checkoutState));
    
    // Show confirmation dialog
    setShowPaymentDialog(true);
  };

  const handleConfirmOpenUpiApp = () => {
    setShowPaymentDialog(false);
    
    // Open UPI app after a brief delay
    setTimeout(() => {
      window.location.href = qrCodeValue;
    }, 300);
    
    toast.info("Opening UPI app... Please return here after payment to enter transaction ID.");
  };

  const handleBackToInfo = () => {
    setShowPayment(false);
  };

  const handlePaymentComplete = () => {
    setHasCompletedPayment(true);
    toast.success("Great! Now enter your transaction ID and click 'Confirm Payment & Place Order'");
  };

  if (isRestoring) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Restoring your checkout session...</p>
      </div>
    );
  }

  if (cart.length === 0 && !formData) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">
          Add some products to your cart before checking out
        </p>
        <Button onClick={() => router.push("/products")}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* Payment Confirmation Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Important: Please Read Before Proceeding
            </DialogTitle>
            <DialogDescription>
              You're about to leave this page to complete your payment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-amber-800 text-sm">
                  <p className="font-medium mb-1">⚠️ Important Notice</p>
                  <p>After completing payment in your UPI app:</p>
                  <ol className="list-decimal pl-4 mt-2 space-y-1">
                    <li>Return to this page (bookmark or keep it open)</li>
                    <li>Enter the transaction ID shown in your payment app</li>
                    <li>Click "Confirm Payment & Place Order" button</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <InfoIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-blue-800 text-sm">
                  <p className="font-medium mb-1">💡 Pro Tip</p>
                  <p>Keep this tab open or bookmark it. Your order will only be confirmed after you enter the transaction ID here.</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="font-medium text-lg">
                Amount to Pay: ₹{paymentMethod === "online" ? total : 100}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {paymentMethod === "cod" ? "Advance payment for COD order" : "Full payment for your order"}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmOpenUpiApp}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open UPI App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add a recovery banner if returning from payment */}
      {showPayment && localStorage.getItem("pendingOrder") && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-green-600" />
            <div className="text-green-800 text-sm">
              <p className="font-medium">Welcome back! Continue with your payment.</p>
              <p>Your order details have been restored. Please enter the transaction ID from your payment app.</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div
            className={`rounded-full h-8 w-8 flex items-center justify-center ${
              showPayment ? "bg-primary" : "bg-primary"
            }`}
          >
            <span className="text-white text-sm">1</span>
          </div>
          <div className="ml-2 text-sm font-medium">Product</div>
        </div>

        <div className="h-0.5 w-12 bg-muted mx-2"></div>

        <div className="flex items-center">
          <div
            className={`rounded-full h-8 w-8 flex items-center justify-center ${
              showPayment ? "bg-primary" : "bg-muted"
            }`}
          >
            <span className="text-white text-sm">2</span>
          </div>
          <div className="ml-2 text-sm font-medium">Pay</div>
        </div>

        <div className="h-0.5 w-12 bg-muted mx-2"></div>

        <div className="flex items-center">
          <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
            transactionId && hasCompletedPayment ? "bg-green-500" : "bg-muted"
          }`}>
            <span className="text-white text-sm">3</span>
          </div>
          <div className="ml-2 text-sm font-medium">Confirm</div>
        </div>
      </div>

      {/* Return policy warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-amber-800 text-sm">
            <p className="font-medium mb-1">
              Important: Please Read Our Return Policy
            </p>
            <p className="text-amber-700">
              Before completing your purchase, please review our{" "}
              <Link
                href="/terms"
                className="text-amber-900 underline font-medium hover:text-amber-700 transition-colors"
                target="_blank"
              >
                return policy
              </Link>
              . All sales are final unless otherwise specified. Some items may
              have specific return conditions please read it before ordering.
            </p>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center">Checkout</h1>

      {showPayment ? (
        <div className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Complete Payment
              </CardTitle>
              <CardDescription>
                {paymentMethod === "online"
                  ? `Please complete your payment of ₹${total} to confirm your order`
                  : `Please pay the ₹100 advance to confirm your COD order. The remaining ₹${
                      total - 100
                    } will be collected on delivery.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Payment Instructions Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <InfoIcon className="h-5 w-5" />
                    Payment Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Scan QR Code or Click "Open in UPI App"</p>
                        <p className="text-sm text-muted-foreground">
                          Complete the payment in your UPI app
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Return to This Page</p>
                        <p className="text-sm text-muted-foreground">
                          Keep this tab open or bookmark it to return easily
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Enter Transaction ID</p>
                        <p className="text-sm text-muted-foreground">
                          Copy the transaction ID from your payment app
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold mt-0.5">
                        4
                      </div>
                      <div>
                        <p className="font-medium">Click Confirm</p>
                        <p className="text-sm text-muted-foreground">
                          Click "Confirm Payment & Place Order" to complete your order
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-primary/5 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Scan className="h-4 w-4" />
                  UPI Payment
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Scan the QR code using any UPI app or click the button below
                  to open your preferred payment app
                </p>

                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="border-2 border-primary/20 rounded-lg p-4 bg-white shadow-sm">
                    <QRCodeCanvas
                      value={qrCodeValue}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Amount to pay:</p>
                      <p className="text-2xl font-bold">
                        ₹{paymentMethod === "online" ? total : 100}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">UPI ID:</p>
                      <p className="text-lg font-mono bg-muted p-2 rounded">
                        {process.env.NEXT_PUBLIC_UPI_ID}
                      </p>
                    </div>

                    <Button 
                      onClick={openUpiApp} 
                      className="w-full" 
                      size="lg"
                      variant="default"
                    >
                      <ExternalLink className="mr-2 h-5 w-5" />
                      Open in UPI App
                    </Button>
                    
                    <div className="text-center">
                      <Button
                        variant="link"
                        onClick={handlePaymentComplete}
                        className="text-sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        I've completed the payment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="transactionId" className="text-base">
                    Transaction ID <span className="text-destructive">*</span>
                  </Label>
                  {transactionId && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      ✓ Transaction ID entered
                    </Badge>
                  )}
                </div>
                <Input
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => {
                    setTransactionId(e.target.value);
                    if (e.target.value.trim()) {
                      setHasCompletedPayment(true);
                    }
                  }}
                  placeholder="Enter transaction ID from your payment app"
                  className="py-2 px-4"
                  required
                />
                <p className="text-sm text-muted-foreground flex items-start gap-1">
                  <InfoIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  After completing payment, please enter the transaction ID
                  provided by your payment app for verification. Your order will not be confirmed until you enter this.
                </p>
              </div>

              {/* Payment Status Indicator */}
              {hasCompletedPayment && transactionId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">Ready to Confirm Order!</p>
                      <p className="text-sm text-green-700">
                        Transaction ID entered. Click the button below to complete your order.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={handleBackToInfo}
                  className="flex-1"
                  size="lg"
                >
                  Back to Information
                </Button>
                <Button
                  onClick={handleSubmit(handleOrder)}
                  disabled={!transactionId.trim() || isSubmitting}
                  className="flex-1"
                  size="lg"
                  variant={hasCompletedPayment ? "default" : "secondary"}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Confirm Payment & Place Order
                    </>
                  )}
                </Button>
              </div>

              {/* Important Reminder */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-amber-800 text-sm">
                    <p className="font-medium mb-1">⚠️ Don't Forget!</p>
                    <p>
                      Your order will only be confirmed after you enter the transaction ID 
                      and click "Confirm Payment & Place Order". If you leave this page without 
                      completing these steps, your payment may not be linked to your order.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary Sidebar */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item._id}
                    className="flex gap-4 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.salesPrice} × {item.cartQty}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {item.size && (
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            Size: {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            Color: {item.color}
                          </span>
                        )}
                      </div>
                      <p className="font-medium mt-1">
                        ₹{item.salesPrice * item.cartQty}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t mt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    {paymentMethod === "online" ? "Shipping" : "COD Charges"}
                    <InfoIcon className="h-3 w-3 text-muted-foreground" />
                  </span>
                  <span>₹{shippingCharges}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>

                <div className="flex items-start gap-2 pt-3 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{deliveryTime}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
       
        // ... rest of the form (same as before, but with proper state restoration)
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit(handleOrder)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                  <CardDescription>
                    Enter your details for order delivery
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customerName">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="customerName"
                      {...register("customerName")}
                      placeholder="Enter your full name"
                      className={
                        errors.customerName ? "border-destructive" : ""
                      }
                    />
                    {errors.customerName && (
                      <p className="text-sm text-destructive">
                        {errors.customerName.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="phoneNumber">
                        Phone Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phoneNumber"
                        {...register("phoneNumber")}
                        placeholder="10-digit mobile number"
                        className={
                          errors.phoneNumber ? "border-destructive" : ""
                        }
                      />
                      {errors.phoneNumber && (
                        <p className="text-sm text-destructive">
                          {errors.phoneNumber.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="alternatePhone">
                        Alternate Phone (Optional)
                      </Label>
                      <Input
                        id="alternatePhone"
                        {...register("alternatePhone")}
                        placeholder="Alternate contact number"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="instagramId">Instagram ID (Optional)</Label>
                    <Input
                      id="instagramId"
                      {...register("instagramId")}
                      placeholder="@username"
                    />
                    <p className="text-sm text-muted-foreground">
                      Helpful for order-related communication
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address">
                      Complete Address{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      {...register("address")}
                      placeholder="House no., Building, Street, Area"
                      rows={3}
                      className={errors.address ? "border-destructive" : ""}
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="district">
                        District <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="district"
                        {...register("district")}
                        placeholder="Your district"
                        className={errors.district ? "border-destructive" : ""}
                      />
                      {errors.district && (
                        <p className="text-sm text-destructive">
                          {errors.district.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="state">
                        State <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="state"
                        {...register("state")}
                        placeholder="Your state"
                        className={errors.state ? "border-destructive" : ""}
                      />
                      {errors.state && (
                        <p className="text-sm text-destructive">
                          {errors.state.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="pincode">
                        Pincode <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="pincode"
                        {...register("pincode")}
                        placeholder="6-digit pincode"
                        className={errors.pincode ? "border-destructive" : ""}
                      />
                      {errors.pincode && (
                        <p className="text-sm text-destructive">
                          {errors.pincode.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="landmark">Landmark (Optional)</Label>
                    <Input
                      id="landmark"
                      {...register("landmark")}
                      placeholder="Nearby famous location"
                    />
                    <p className="text-sm text-muted-foreground">
                      Helps our delivery partner locate your address easily
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Choose how you want to pay</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === "online"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/30"
                    }`}
                    onClick={() => setPaymentMethod("online")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                          paymentMethod === "online"
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {paymentMethod === "online" && (
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <Label
                        htmlFor="online"
                        className="flex-1 cursor-pointer font-normal"
                      >
                        <div className="flex justify-between items-center">
                          <span>Online Payment (Full Amount)</span>
                          <span className="text-green-600 text-sm">
                            Free Shipping
                          </span>
                        </div>
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground pl-8 mt-1">
                      Pay now using UPI, card, or wallet. Get free shipping!
                    </p>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === "cod"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/30"
                    }`}
                    onClick={() => setPaymentMethod("cod")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                          paymentMethod === "cod"
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {paymentMethod === "cod" && (
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <Label
                        htmlFor="cod"
                        className="flex-1 cursor-pointer font-normal"
                      >
                        <div className="flex justify-between items-center">
                          <span>Cash on Delivery</span>
                          <div>
                            <span className="text-sm text-red-500">
                              + ₹100 Extra{" "}
                            </span>
                            <Badge className="text-xs w-fit">Advance</Badge>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <p className="text-sm text-muted-foreground pl-8 mt-1">
                      An additional ₹100 COD charge will be added on top of your
                      product amount.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <p className="text-amber-800 text-sm">
                    Please review our{" "}
                    <Link
                      href="/terms"
                      className="font-medium underline hover:text-amber-700 transition-colors"
                      target="_blank"
                    >
                      return policy
                    </Link>{" "}
                    before completing your purchase.
                  </p>
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg">
                Proceed to Payment
              </Button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {cart.map((item) => (
                    <div key={item._id} className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          ₹{item.salesPrice} × {item.cartQty}
                        </p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {item.size && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                              Color: {item.color}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-sm mt-1">
                          ₹{item.salesPrice * item.cartQty}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      {paymentMethod === "online" ? "Shipping" : "COD Charges"}
                    </span>
                    <span>
                      {shippingCharges === 0 ? "Free" : `₹${shippingCharges}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>

                  <div className="flex items-start gap-2 pt-3 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{deliveryTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <p className="text-amber-800 text-sm">
                Please review our{" "}
                <Link
                  href="/terms"
                  className="font-medium underline hover:text-amber-700 transition-colors"
                  target="_blank"
                >
                  return policy
                </Link>{" "}
                before completing your purchase.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}