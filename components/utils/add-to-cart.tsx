"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingCart, Check, Loader2 } from "lucide-react";

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
  size?: string | null;
  color?: string | null;
  slug?: string;
};

type Props = {
  product: Omit<CartItem, "cartQty" | "size" | "color">;
  selectedSize?: string | null;
  selectedColor?: string | null;
  className?: string;
  hasSizes?: boolean;
  hasColors?: boolean;
  disabled?: boolean; // Added disabled prop for out-of-stock scenarios
};

const AddToCartButton = ({
  product,
  selectedSize,
  selectedColor,
  className,
  hasSizes,
  hasColors,
  disabled = false,
}: Props) => {
  const [inCart, setInCart] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
    const exists = cartItems.some(
      (item: CartItem) =>
        item._id === product._id &&
        (hasSizes ? item.size === selectedSize : true) &&
        (hasColors ? item.color === selectedColor : true)
    );
    setInCart(exists);
  }, [product._id, selectedSize, selectedColor, hasSizes, hasColors]);

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      toast.warning("Please select a size before adding to cart.");
      return;
    }
    
    if (hasColors && !selectedColor) {
      toast.warning("Please select a color before adding to cart.");
      return;
    }
    
    // Check if product is out of stock
    if (product.quantity <= 0) {
      toast.error("This product is out of stock.");
      return;
    }

    setIsLoading(true);

    try {
      const cartItems: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");

      const existingIndex = cartItems.findIndex(
        (item) =>
          item._id === product._id &&
          (hasSizes ? item.size === selectedSize : true) &&
          (hasColors ? item.color === selectedColor : true)
      );

      if (existingIndex >= 0) {
        // Check if we can add more of this item
        if (cartItems[existingIndex].cartQty >= cartItems[existingIndex].maxQty) {
          toast.error(`Maximum quantity (${cartItems[existingIndex].maxQty}) reached for this item.`);
          return;
        }
        
        cartItems[existingIndex].cartQty += 1;
        toast.success("Quantity increased in cart.");
      } else {
        const newProduct: CartItem = {
          ...product,
          image: product.image || product.images?.[0]?.url || "",
          size: hasSizes ? selectedSize : null,
          color: hasColors ? selectedColor : null,
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

  // Handle out of stock scenario
  if (product.quantity <= 0) {
    return (
      <Button
        className={`w-full gap-2 ${className}`}
        disabled={true}
        variant="outline"
      >
        Out of Stock
      </Button>
    );
  }

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
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Adding...
        </>
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