// app/order/[id]/page.tsx
"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { urlFor } from "@/lib/sanity";
import Link from "next/link";

type Product = {
  _id: string;
  name: string;
  price: number;
  salesPrice: number;
  images: any[]; // Changed from 'image' to 'images' to match your schema
  slug?: {
    current: string;
  };
};

type OrderItem = {
  product: Product;
  quantity: number;
  size: string;
  color?: string;
};

type Order = {
  _id: string;
  customerName: string;
  phoneNumber: string;
  alternatePhone?: string;
  instagramId?: string;
  address: string;
  landmark?: string;
  district: string;
  state: string;
  pincode: string;
  products: OrderItem[];
  paymentMode: "cod" | "online";
  transactionId?: string;
  shippingCharges: number;
  orderStatus: string;
  orderedAt: string;
  totalAmount: number;
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function OrderPage({ params }: Props) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/order/${id}`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to fetch order");

        const data = await res.json();
        setOrder(data.order);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch order");
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <h1 className="text-xl font-bold mb-4">Error loading order</h1>
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => router.push("/track-order")}>
          View Your Orders
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <h1 className="text-xl font-bold mb-4">Order not found</h1>
        <Button onClick={() => router.push("/track-order")}>
          View Your Orders
        </Button>
      </div>
    );
  }

  const subtotal = order.products.reduce(
    (sum, item) => sum + item.product.salesPrice * item.quantity,
    0
  );
  
  const generateWhatsAppMessage = (order: Order) => {
    const productsText = order.products
      .map(
        (item) =>
          `${item.product.name} (Qty: ${item.quantity}, Size: ${item.size}${
            item.color ? `, Color: ${item.color}` : ""
          }) - ₹${item.product.salesPrice * item.quantity}`
      )
      .join("\n");

    return `Hi, I have a question about my order #${order._id
      .slice(-6)
      .toUpperCase()}\n\nProducts:\n${productsText}\n\nTotal: ₹${
      order.totalAmount
    }\n\nOrder Status: ${order.orderStatus}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Order #{order._id.slice(-6).toUpperCase()}
        </h1>
        <div className="flex gap-1 overflow-hidden">
        
          {order.paymentMode === "online" && (
            <Button variant="outline" onClick={() => window.print()}>
              Print Invoice
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              const message = encodeURIComponent(
                generateWhatsAppMessage(order)
              );
              window.open(`https://wa.me/${process.env.NEXT_PUBLIC_PHONE}?text=${message}`, "_blank");
            }}
          >
            Message on WhatsApp
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.products.map((item: any, index) => (
              <div
                key={index}
                className="flex gap-4 border-b pb-4 last:border-b-0"
              >
                <Link href={`/product/${item.product.id}`}>
                  <Image
                    src={urlFor(item.product.images[0])?.url()}
                    alt={item.product.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded cursor-pointer"
                  />
                </Link>
                <div className="flex-1">
                  <Link href={`/product/${item.product.id}`}>
                    <h3 className="font-medium hover:underline cursor-pointer">
                      {item.product.name}
                    </h3>
                  </Link>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Price:</span>{" "}
                      <span>₹{item.product.salesPrice}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Qty:</span>{" "}
                      <span>{item.quantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Size:</span>{" "}
                      <span>{item.size}</span>
                    </div>
                    {item.color && (
                      <div>
                        <span className="text-muted-foreground">Color:</span>{" "}
                        <span>{item.color}</span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Total:</span>{" "}
                      <span>₹{item.product.salesPrice * item.quantity}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹{order.shippingCharges}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>Total</span>
                <span>₹{subtotal + order.shippingCharges}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-sm text-muted-foreground">
                  {order.phoneNumber}
                  {order.alternatePhone && `, ${order.alternatePhone}`}
                </p>
              </div>
              <div className="mt-2">
                <p>{order.address}</p>
                {order.landmark && <p>Near {order.landmark}</p>}
                <p>
                  {order.district}, {order.state} - {order.pincode}
                </p>
              </div>
              {order.instagramId && (
                <div className="mt-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Instagram:</span>{" "}
                    {order.instagramId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method:</span>
                <span className="capitalize">
                  {order.paymentMode === "cod"
                    ? "Cash on Delivery"
                    : "Online Payment"}
                </span>
              </div>
              {order.transactionId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span>{order.transactionId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="capitalize">{order.orderStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date:</span>
                <span>
                  {new Date(order.orderedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}