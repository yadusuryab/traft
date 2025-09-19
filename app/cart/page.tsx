"use client";

import { CartItem } from "@/components/utils/add-to-cart";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Trash2, X, Plus, Minus, ArrowRight, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const SHIPPING_COST = 0;


function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);


  useEffect(() => {
    const loadCart = () => {
      try {
        const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
        console.log(localCart)
        setCart(localCart);
      } catch (error) {
        console.error("Failed to load cart", error);
      } finally {
        setLoading(false);
      }
    };
    loadCart();
  }, []);

  const updateCartQty = (id: string, newQty: number) => {
    // Prevent quantity from going below 1
    if (newQty < 1) newQty = 1;
    
    const product = cart.find((item) => item._id === id);
    if (!product) return;
    
    const newQtyLimited = Math.min(newQty, product.maxQty);
    const updated = cart.map((item) =>
      item._id === id ? { ...item, cartQty: newQtyLimited } : item
    );
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    
    if (newQtyLimited !== newQty) {
      toast(`Cart Updated. Max quantity is ${product.maxQty}`);
    }
  };

  const removeFromCart = (id: string) => {
    const updated = cart.filter((item) => item._id !== id);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    toast("Item Removed");
  };

  const clearCart = () => {
    setCart([]);
    localStorage.setItem("cart", JSON.stringify([]));
    toast("Cart Cleared");
  };

  // const applyCoupon = () => {
  //   // Simple coupon logic - in real app you'd validate with backend
  //   if (coupon.toUpperCase() === "SAVE10") {
  //     setDiscount(0.1); // 10% discount
  //     toast({
  //       title: "Coupon applied",
  //       description: "You got 10% off your order!",
  //     });
  //   } else {
  //     setDiscount(0);
  //     toast({
  //       title: "Invalid coupon",
  //       description: "The coupon code you entered is not valid",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.salesPrice * item.cartQty,
    0
  );

  const discountAmount = subtotal * discount;
  const shippingCost = SHIPPING_COST;
  const total = subtotal - discountAmount + shippingCost;

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex gap-4">
                <Skeleton className="w-24 h-24" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Shopping Cart</h1>

      {cart.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added anything to your cart yet
          </p>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">
                {cart.length} {cart.length === 1 ? "Item" : "Items"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear cart
              </Button>
            </div>

            <AnimatePresence>
              {cart.map((item:any) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ type: "spring" }}
                >
                  <Card>
                    <CardContent className="p-4 flex gap-4">
                      <Link href={`/products/${item._id}`}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-md hover:opacity-90 transition-opacity"
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <Link href={`/products/${item._id}`}>
                            <h2 className="font-semibold hover:underline">
                              {item.name}
                            </h2>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item._id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="font-medium">
  ₹{((item.salesPrice ?? item.price) * item.cartQty).toFixed(2)}
</p>


{/* ✅ show size only if it exists */}
{item.size && (
  <p className="text-xs text-gray-500 mt-1">
    Size: {item.size}
  </p>
)}

{/* ✅ show color only if it exists */}
{item.color && (
  <p className="text-xs text-gray-500 mt-1">
    Colour: {item.color}
  </p>
)}


                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateCartQty(item._id, item.cartQty - 1)
                              }
                              disabled={item.cartQty <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center">
                              {item.cartQty}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateCartQty(item._id, item.cartQty + 1)
                              }
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="font-medium">
                            ₹{(item.salesPrice * item.cartQty).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <h2 className="font-semibold">Order Summary</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({discount * 100}%)</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                 
                      {shippingCost === 0 ? "Free" : '₹ ' + shippingCost}
                  
                  </span>
                </div>
                
                <div className="border-t pt-3 mt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                {/* <div className="flex w-full gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                  />
                  <Button
                    variant="secondary"
                    onClick={applyCoupon}
                    disabled={!coupon.trim()}
                  >
                    Apply
                  </Button>
                </div> */}
                <Link href="/checkout" className="w-full">
                  <Button className="w-full" size="lg">
                    Checkout <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/products" className="w-full">
                  <Button variant="outline" className="w-full"  size="lg">
                    Continue Shopping
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;