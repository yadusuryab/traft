// app/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { checkoutSchema } from "@/lib/validations";
import { QRCodeCanvas } from "qrcode.react";
import { Loader2, InfoIcon, Truck, CreditCard, Scan } from "lucide-react";

type CartItem = {
  _id: string;
  name: string;
  salesPrice: number;
  cartQty: number;
  size: string;
  color?: string;
  image: string;
};

type FormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(checkoutSchema),
  });

  useEffect(() => {
    const cartData = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(cartData);
  }, []);

  useEffect(() => {
    if (paymentMethod === "online") {
      setShippingCharges(0); // free shipping
      setDeliveryTime("Kerala: 2-3 days | Outside Kerala: 6-7 days");
    } else {
      setShippingCharges(100); // COD extra
      setDeliveryTime("Delivery in 7 days");
    }
  }, [paymentMethod]);

  const subtotal = cart.reduce((acc, item) => acc + item.salesPrice * item.cartQty, 0);
  const total = subtotal + shippingCharges;

  const generateUpiLink = (amount: number) => {
    const upiId = process.env.NEXT_PUBLIC_UPI_ID;
    const note = `Payment for order`;
    return `upi://pay?pa=${upiId}&pn=${process.env.NEXT_PUBLIC_APP_NAME}&am=${amount}&tn=${note}`;
  };

  const handleOrder = async (data: FormData) => {
    const paymentAmount = paymentMethod === "online" ? total : 100;

    if (!showPayment) {
      setQrCodeValue(generateUpiLink(paymentAmount));
      localStorage.setItem("pendingOrder", JSON.stringify({ ...data, cart, total, paymentMethod }));
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
          size: p.size,
          color: p.color,
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
      localStorage.removeItem("cart");
      localStorage.removeItem("pendingOrder");
      router.push(`/order/${respdata.orderId}`);
    } catch (error) {
      toast.error("Failed to place order. Please try again.");
      console.error("Order error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openUpiApp = () => {
    window.location.href = qrCodeValue;
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Add some products to your cart before checking out</p>
        <Button onClick={() => router.push("/products")}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className={`rounded-full h-8 w-8 flex items-center justify-center ${showPayment ? "bg-primary" : "bg-primary"}`}>
            <span className="text-white text-sm">1</span>
          </div>
          <div className="ml-2 text-sm font-medium">Information</div>
        </div>
        
        <div className="h-0.5 w-12 bg-muted mx-2"></div>
        
        <div className="flex items-center">
          <div className={`rounded-full h-8 w-8 flex items-center justify-center ${showPayment ? "bg-primary" : "bg-muted"}`}>
            <span className="text-white text-sm">2</span>
          </div>
          <div className="ml-2 text-sm font-medium">Payment</div>
        </div>
        
        <div className="h-0.5 w-12 bg-muted mx-2"></div>
        
        <div className="flex items-center">
          <div className="rounded-full h-8 w-8 flex items-center justify-center bg-muted">
            <span className="text-white text-sm">3</span>
          </div>
          <div className="ml-2 text-sm font-medium">Confirmation</div>
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
                  : `Please pay the ₹100 advance to confirm your COD order. The remaining ₹${total - 100} will be collected on delivery.`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="bg-primary/5 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Scan className="h-4 w-4" />
                  UPI Payment
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Scan the QR code using any UPI app or click the button below to open your preferred payment app
                </p>
                
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="border-2 border-primary/20 rounded-lg p-4 bg-white shadow-sm">
                    <QRCodeCanvas value={qrCodeValue} size={200} level="H" includeMargin={true} />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Amount to pay:</p>
                      <p className="text-2xl font-bold">₹{paymentMethod === "online" ? total : 100}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">UPI ID:</p>
                      <p className="text-lg font-mono bg-muted p-2 rounded">{process.env.NEXT_PUBLIC_UPI_ID}</p>
                    </div>
                    
                    <Button onClick={openUpiApp} className="w-full" size="lg">
                      Open in UPI App
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="transactionId" className="text-base">
                  Transaction ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID from your payment app"
                  className="py-2 px-4"
                  required
                />
                <p className="text-sm text-muted-foreground flex items-start gap-1">
                  <InfoIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  After completing payment, please enter the transaction ID provided by your payment app for verification.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPayment(false)} 
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
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Payment & Place Order"
                  )}
                </Button>
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
                  <div key={item._id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.salesPrice} × {item.cartQty}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {item.size && (
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">Size: {item.size}</span>
                        )}
                        {item.color && (
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">Color: {item.color}</span>
                        )}
                      </div>
                      <p className="font-medium mt-1">₹{item.salesPrice * item.cartQty}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit(handleOrder)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                  <CardDescription>Enter your details for order delivery</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customerName">Full Name <span className="text-destructive">*</span></Label>
                    <Input 
                      id="customerName" 
                      {...register("customerName")} 
                      placeholder="Enter your full name" 
                      className={errors.customerName ? "border-destructive" : ""}
                    />
                    {errors.customerName && (
                      <p className="text-sm text-destructive">{errors.customerName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="phoneNumber">Phone Number <span className="text-destructive">*</span></Label>
                      <Input 
                        id="phoneNumber" 
                        {...register("phoneNumber")} 
                        placeholder="10-digit mobile number" 
                        className={errors.phoneNumber ? "border-destructive" : ""}
                      />
                      {errors.phoneNumber && (
                        <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="alternatePhone">Alternate Phone (Optional)</Label>
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
                    <Label htmlFor="address">Complete Address <span className="text-destructive">*</span></Label>
                    <Textarea 
                      id="address" 
                      {...register("address")} 
                      placeholder="House no., Building, Street, Area" 
                      rows={3}
                      className={errors.address ? "border-destructive" : ""}
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="district">District <span className="text-destructive">*</span></Label>
                      <Input 
                        id="district" 
                        {...register("district")} 
                        placeholder="Your district" 
                        className={errors.district ? "border-destructive" : ""}
                      />
                      {errors.district && (
                        <p className="text-sm text-destructive">{errors.district.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
                      <Input 
                        id="state" 
                        {...register("state")} 
                        placeholder="Your state" 
                        className={errors.state ? "border-destructive" : ""}
                      />
                      {errors.state && (
                        <p className="text-sm text-destructive">{errors.state.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="pincode">Pincode <span className="text-destructive">*</span></Label>
                      <Input 
                        id="pincode" 
                        {...register("pincode")} 
                        placeholder="6-digit pincode" 
                        className={errors.pincode ? "border-destructive" : ""}
                      />
                      {errors.pincode && (
                        <p className="text-sm text-destructive">{errors.pincode.message}</p>
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
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        paymentMethod === "online" ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}>
                        {paymentMethod === "online" && <div className="h-2 w-2 rounded-full bg-white"></div>}
                      </div>
                      <Label htmlFor="online" className="flex-1 cursor-pointer font-normal">
                        <div className="flex justify-between items-center">
                          <span>Online Payment (Full Amount)</span>
                          <span className="text-green-600 text-sm">Free Shipping</span>
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
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        paymentMethod === "cod" ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}>
                        {paymentMethod === "cod" && <div className="h-2 w-2 rounded-full bg-white"></div>}
                      </div>
                      <Label htmlFor="cod" className="flex-1 cursor-pointer font-normal">
  <div className="flex justify-between items-center">
    <span>Cash on Delivery</span>
    <span className="text-sm text-red-500">+ ₹100 Extra</span>
  </div>
</Label>

                    </div>
                  
<p className="text-sm text-muted-foreground pl-8 mt-1">
  An additional ₹100 COD charge will be added on top of your product amount.
</p>

                  </div>
                </CardContent>
              </Card>

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
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          ₹{item.salesPrice} × {item.cartQty}
                        </p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {item.size && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Size: {item.size}</span>
                          )}
                          {item.color && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Color: {item.color}</span>
                          )}
                        </div>
                        <p className="font-medium text-sm mt-1">₹{item.salesPrice * item.cartQty}</p>
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
                    <span>{shippingCharges === 0 ? "Free" : `₹${shippingCharges}`}</span>
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
        </div>
      )}
    </div>
  );
}