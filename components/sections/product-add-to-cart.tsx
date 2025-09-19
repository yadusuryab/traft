"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AddToCartButton from "@/components/utils/add-to-cart";
import { Check, X } from "lucide-react";

type Props = {
  product: {
    _id: string;
    name: string;
    price: number;
    salesPrice: number;
    maxQty: number;
    image: string;
    quantity: number;
    sizes: string[];
    colors: string[];
    images: any;
  };
};

const ProductBuySection = ({ product }: Props) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isInCart, setIsInCart] = useState(false);

  // Check if product with size/color is already in cart
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const match = cart.find(
      (item: any) =>
        item._id === product._id &&
        item.size === selectedSize &&
        item.color === selectedColor
    );
    
    setIsInCart(!!match);
    
    // If no selection yet, try to pre-select based on cart
    if (!selectedSize || !selectedColor) {
      const cartItem = cart.find((item: any) => item._id === product._id);
      if (cartItem) {
        if (cartItem.size && !selectedSize) setSelectedSize(cartItem.size);
        if (cartItem.color && !selectedColor) setSelectedColor(cartItem.color);
      }
    }
  }, [product._id, selectedSize, selectedColor]);

  const handleSizeSelect = (size: string) => {
    if (selectedSize === size) {
      setSelectedSize(null);
    } else {
      setSelectedSize(size);
    }
  };

  const handleColorSelect = (color: string) => {
    if (selectedColor === color) {
      setSelectedColor(null);
    } else {
      setSelectedColor(color);
    }
  };

  const clearSelection = () => {
    setSelectedSize(null);
    setSelectedColor(null);
  };

  return (
    <div className="space-y-4">
      {/* Sizes */}
      {product.sizes?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Select Size</h4>
            {selectedSize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSize(null)}
                className="h-8 px-2 text-xs text-muted-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <Button
                key={size}
                variant={selectedSize === size ? "default" : "outline"}
                className={`relative min-w-[60px] h-10 ${
                  selectedSize === size ? "border-2 border-primary" : ""
                }`}
                onClick={() => handleSizeSelect(size)}
              >
                {size}
                {selectedSize === size && (
                  <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Colors */}
      {product.colors?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Select Color</h4>
            {selectedColor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedColor(null)}
                className="h-8 px-2 text-xs text-muted-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <Button
                key={color}
                variant={selectedColor === color ? "default" : "outline"}
                className={`relative min-w-[80px] h-10 ${
                  selectedColor === color ? "border-2 border-primary" : ""
                }`}
                onClick={() => handleColorSelect(color)}
              >
                {color}
                {selectedColor === color && (
                  <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {(selectedSize || selectedColor) && (
        <div className="bg-muted/30 p-3 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Your Selection</h4>
          <div className="flex flex-wrap gap-2 text-sm">
            {selectedSize && (
              <span className="bg-background px-3 py-1 rounded-full border">
                Size: {selectedSize}
              </span>
            )}
            {selectedColor && (
              <span className="bg-background px-3 py-1 rounded-full border">
                Color: {selectedColor}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-7 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Add to cart */}
      <div className="pt-2">
        <AddToCartButton
          product={product}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
          hasSizes={product.sizes?.length > 0}
          hasColors={product.colors?.length > 0}
        />
        
        {isInCart && (
          <p className="text-sm text-green-600 mt-2 flex items-center">
            <Check className="h-4 w-4 mr-1" />
            This item is in your cart
          </p>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground">
        {product.sizes?.length > 0 && product.colors?.length > 0 ? (
          <p>Please select both size and color before adding to cart</p>
        ) : product.sizes?.length > 0 ? (
          <p>Please select a size before adding to cart</p>
        ) : product.colors?.length > 0 ? (
          <p>Please select a color before adding to cart</p>
        ) : null}
      </div>
    </div>
  );
};

export default ProductBuySection;