"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingCart, Check } from "lucide-react";

export type CartItem = {
  _id: string;
  name: string;
  price: number;
  salesPrice: number;
  image: string;
  images?: { url: string }[];
  quantity: number;
  cartQty: number;
  maxQty: number;
  size?: string | null; // ✅ make size optional
  slug?: string;
};

type Props = {
  product: Omit<CartItem, "cartQty" | "size">;
  selectedSize?: string | null; // ✅ optional
  className?: string;
  hasSizes?: boolean; // ✅ flag to check if product requires size
};

const AddToCartButton = ({ product, selectedSize, className, hasSizes }: Props) => {
  const [inCart, setInCart] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
    const exists = cartItems.some(
      (item: CartItem) =>
        item._id === product._id && (hasSizes ? item.size === selectedSize : true)
    );
    setInCart(exists);
  }, [product._id, selectedSize, hasSizes]);

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      toast.warning("Please select a size before adding to cart.");
      return;
    }

    setIsLoading(true);

    try {
      const cartItems: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");

      const existingIndex = cartItems.findIndex(
        (item) => item._id === product._id && (hasSizes ? item.size === selectedSize : true)
      );

      if (existingIndex >= 0) {
        cartItems[existingIndex].cartQty += 1;
        toast.success("Quantity increased in cart.");
      } else {
        const newProduct: CartItem = {
          ...product,
          image: product.image || product.images?.[0]?.url || "",
          size: hasSizes ? selectedSize : null, // ✅ only set if sizes exist
          cartQty: 1,
          maxQty: product.quantity,
        };

        cartItems.push(newProduct);
        toast.success("Product added to cart!");
      }

      localStorage.setItem("cart", JSON.stringify(cartItems));
      setInCart(true);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      toast.error("Failed to add product to cart.");
      console.error("Add to cart error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (inCart) {
    return (
      <Button
        variant="outline"
        className={`w-full gap-2 ${className}`}
        onClick={() => router.push("/cart")}
      >
        <Check className="h-4 w-4" />
        View in Cart
      </Button>
    );
  }

  return (
    <Button
      className={`w-full gap-2 ${className}`}
      onClick={handleAddToCart}
      disabled={isLoading}
    >
      {isLoading ? (
        "Adding..."
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </>
      )}
    </Button>
  );
};

export default AddToCartButton;
