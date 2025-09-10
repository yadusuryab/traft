// app/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { checkoutSchema } from "@/lib/validations";
import { QRCodeCanvas } from "qrcode.react";
import { Loader2 } from "lucide-react";

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
  useEffect(() => {
    if (paymentMethod === "online") {
      setShippingCharges(0); // free shipping
      setDeliveryTime("Kerala: 2-3 days | Outside Kerala: 6-7 days");
    } else {
      setShippingCharges(100); // COD extra
      setDeliveryTime("Delivery in 7 days");
    }
  }, [paymentMethod]);
  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <h1 className="text-xl font-bold mb-4">Your cart is empty</h1>
        <Button onClick={() => router.push("/products")}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      {showPayment ? (
        <Card>
          <CardHeader>
            <CardTitle>Complete Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-lg font-semibold">
              {paymentMethod === "online"
                ? `Total Amount: ₹${total}`
                : `Advance Payment: ₹100 (Remaining COD: ₹${total - 100})`}
            </div>

            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">UPI Payment</h3>
                <div className="flex flex-col items-center gap-4">
                  <div className="border rounded p-2 bg-white">
                    <QRCodeCanvas value={qrCodeValue} size={200} level="H" includeMargin={true} />
                  </div>

                  <div className="text-center">
                    <p className="font-medium">Scan QR or pay to:</p>
                    <p className="text-lg font-bold">{process.env.NEXT_PUBLIC_UPI_ID}</p>
                    <p className="text-sm text-muted-foreground">
                      Amount: ₹{paymentMethod === "online" ? total : 100}
                    </p>
                  </div>

                  <Button onClick={openUpiApp} className="w-full" variant="outline">
                    Open in UPI App
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID (Required)</Label>
                <Input
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID from payment app"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Please enter the transaction ID after payment for verification.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setShowPayment(false)} className="w-full">
                Back
              </Button>
              <Button
                onClick={handleSubmit(handleOrder)}
                disabled={!transactionId || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Payment"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(handleOrder)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => (
                <div key={item._id} className="flex gap-4 border-b pb-4">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm">
                      ₹{item.salesPrice} × {item.cartQty} = ₹{item.salesPrice * item.cartQty}
                    </p>
                    {item.size && <p className="text-sm">Size: {item.size}</p>}
                    {item.color && <p className="text-sm">Color: {item.color}</p>}
                  </div>
                </div>
              ))}

<div className="space-y-2 pt-2">
  <div className="flex justify-between">
    <span>Subtotal</span>
    <span>₹{subtotal}</span>
  </div>
  <div className="flex justify-between">
    <span>{paymentMethod === "online" ? "Shipping (Free)" : "COD Charges"}</span>
    <span>₹{shippingCharges}</span>
  </div>
  <div className="flex justify-between font-bold text-lg">
    <span>Total</span>
    <span>₹{subtotal + shippingCharges}</span>
  </div>
  <p className="text-sm text-muted-foreground">
    {deliveryTime}
  </p>
</div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customerName">Full Name</Label>
                <Input id="customerName" {...register("customerName")} placeholder="Enter your full name" />
                {errors.customerName && (
                  <p className="text-sm text-destructive">{errors.customerName.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" {...register("phoneNumber")} placeholder="Enter your phone number" />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="alternatePhone">Alternate Phone (Optional)</Label>
                <Input id="alternatePhone" {...register("alternatePhone")} placeholder="Enter alternate phone number" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="instagramId">Instagram ID (Optional)</Label>
                <Input id="instagramId" {...register("instagramId")} placeholder="Enter your Instagram username" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" {...register("address")} placeholder="Enter your full address" />
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="district">District</Label>
                  <Input id="district" {...register("district")} placeholder="Enter your district" />
                  {errors.district && (
                    <p className="text-sm text-destructive">{errors.district.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" {...register("state")} placeholder="Enter your state" />
                  {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" {...register("pincode")} placeholder="Enter your pincode" />
                  {errors.pincode && <p className="text-sm text-destructive">{errors.pincode.message}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="landmark">Landmark (Optional)</Label>
                  <Input id="landmark" {...register("landmark")} placeholder="Enter nearby landmark" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="online"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                />
                <Label htmlFor="online">Online (Full Payment)</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="cod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <Label htmlFor="cod">Cash on Delivery (₹100 Advance)</Label>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg">
            Proceed to Payment
          </Button>
        </form>
      )}
    </div>
  );
}
