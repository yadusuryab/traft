"use client";

import React, { useEffect, useState } from "react";
import ProductCard from "../cards/product-card";
import ProductCardSkeleton from "../utils/product-card-skelton";
import { Product } from "@/lib/queries/product";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  products: Product[];
  title?: string;
  desc?: string;
  showViewAll?: boolean;
  deskCols?: number;
};

function ProductsSection({
  products,
  title = "Explore",
  desc = "",
  showViewAll = false,
  deskCols = 4
}: Props) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 500); // simulate loading delay
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl uppercase">{title}</h2>
          <p className="text-muted-foreground text-sm">
            {desc}
          </p>
        </div>
      </div>

      <div className={cn(
        "grid gap-2 md:gap-4 mb-6",
        `grid-cols-2 md:grid-cols-${deskCols}`
      )}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))
        ) : products.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">
            No products found.
          </p>
        ) : (
          products.map((prod, i) => (
            <ProductCard
              key={i}
              id={prod._id}
              name={prod.name}
              rating={prod.rating}
              imageUrl={prod.image}
              price={prod.price}
              salesPrice={prod.salesPrice}
            />
          ))
        )}
      </div>

      {showViewAll && (
        <div className="flex justify-center">
          <Link 
            href="/products" 
            className={cn(
              buttonVariants({ variant: 'default' }),
              "flex items-center gap-2"
            )}
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default ProductsSection;