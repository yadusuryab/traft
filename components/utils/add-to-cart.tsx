"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingCart, Check, Loader2, Zap } from "lucide-react";

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
  disabled?: boolean;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  showBuyNow?: boolean;
};

const AddToCartButton = ({
  product,
  selectedSize,
  selectedColor,
  className,
  hasSizes,
  hasColors,
  disabled = false,
  variant = "default",
  showBuyNow = false,
}: Props) => {
  const [inCart, setInCart] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuyNowLoading, setIsBuyNowLoading] = useState(false);
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

  const addToCart = (redirectToCart = false) => {
    if (hasSizes && !selectedSize) {
      toast.warning("Please select a size before adding to cart.");
      return false;
    }
    
    if (hasColors && !selectedColor) {
      toast.warning("Please select a color before adding to cart.");
      return false;
    }
    
    if (product.quantity <= 0) {
      toast.error("This product is out of stock.");
      return false;
    }

    redirectToCart ? setIsBuyNowLoading(true) : setIsLoading(true);

    try {
      const cartItems: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");

      const existingIndex = cartItems.findIndex(
        (item) =>
          item._id === product._id &&
          (hasSizes ? item.size === selectedSize : true) &&
          (hasColors ? item.color === selectedColor : true)
      );

      if (existingIndex >= 0) {
        if (cartItems[existingIndex].cartQty >= cartItems[existingIndex].maxQty) {
          toast.error(`Maximum quantity (${cartItems[existingIndex].maxQty}) reached for this item.`);
          return false;
        }
        
        cartItems[existingIndex].cartQty += 1;
        if (!redirectToCart) {
          toast.success("Quantity increased in cart.");
        }
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
        if (!redirectToCart) {
          toast.success("Product added to cart!");
        }
      }

      localStorage.setItem("cart", JSON.stringify(cartItems));
      setInCart(true);
      window.dispatchEvent(new Event("cart-updated"));
      
      return true;
    } catch (error) {
      toast.error("Failed to add product to cart.");
      console.error("Add to cart error:", error);
      return false;
    } finally {
      if (redirectToCart) {
        setIsBuyNowLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleAddToCart = () => {
    addToCart(false);
  };

  const handleBuyNow = () => {
    const success = addToCart(true);
    if (success) {
      router.push("/cart");
    }
  };

  // Handle out of stock scenario
  if (product.quantity <= 0) {
    return (
      <div className={`flex gap-2 ${showBuyNow ? 'flex-col' : ''}`}>
        <Button
          className={`w-full gap-2 ${className}`}
          disabled={true}
          variant="outline"
        >
          Out of Stock
        </Button>
        {showBuyNow && (
          <Button
            className="w-full gap-2"
            disabled={true}
            variant="outline"
          >
            <Zap className="h-4 w-4" />
            Buy Now
          </Button>
        )}
      </div>
    );
  }

  if (inCart && !showBuyNow) {
    return (
      <Button
        variant="secondary"
        className={`w-full gap-2 ${className}`}
        onClick={() => router.push("/cart")}
      >
        <Check className="h-4 w-4" />
        View in Cart
      </Button>
    );
  }

  return (
    <div className={`flex gap-2 ${showBuyNow ? 'flex-col' : ''}`}>
      {inCart ? (
        <Button
          variant="secondary"
          className={`w-full gap-2 ${className}`}
          onClick={() => router.push("/cart")}
        >
          <Check className="h-4 w-4" />
          View in Cart
        </Button>
      ) : (
        <Button
          variant={variant}
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
      )}
      
      {showBuyNow && (
        <Button
          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
          onClick={handleBuyNow}
          disabled={isBuyNowLoading || disabled}
        >
          {isBuyNowLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Buy Now
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default AddToCartButton;