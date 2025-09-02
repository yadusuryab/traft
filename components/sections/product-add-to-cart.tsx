"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AddToCartButton from "@/components/utils/add-to-cart";

type Props = {
  product: {
    _id: string;
    name: string;
    price: number;
    salesPrice: number;
    maxQty:number;
    image: string;
    quantity:number;
    sizes: string[];
   images:any;
  };
};

const ProductBuySection = ({ product }: Props) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // 🧠 Check if product with size is already in cart
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    const match = cart.find(
      (item: any) => item._id === product._id
    );

    if (match?.size) {
      setSelectedSize(match.size);
    }
  }, [product._id]);

  return (
    <>
      <h4 className="text-md font-semibold mt-4">Sizes</h4>
      <div className="flex max-w-2xl overflow-x-auto gap-2">
        {product.sizes?.map((size) => (
          <Button
            key={size}
            variant={selectedSize === size ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedSize(size)}
          >
            {size}
          </Button>
        ))}
      </div>
      <div className="mt-4">
        <AddToCartButton product={product} selectedSize={selectedSize} />
      </div>
    </>
  );
};

export default ProductBuySection;
