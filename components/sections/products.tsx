"use client";

import React, { useEffect, useState } from "react";
import ProductCard from "../cards/product-card";
import ProductCardSkeleton from "../utils/product-card-skelton";
import { Product } from "@/lib/queries/product";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { ArrowRight } from "lucide-react";

type Props = {
  products: Product[];
  title?: string;
  desc?:string;
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
    <div className="py-6 ">
      <div className="flex justify-between items-center mb-4">
        <div>
        <h2 className="text-xl italic font-serif">{title}</h2>
        <p className="text-muted-foreground text-sm">
        {desc}
            </p>
        </div>
        {showViewAll && (
          <Link href="/products"className={buttonVariants({variant:'secondary'})}>
            View All <ArrowRight/>
          </Link>
        )}
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-${deskCols} gap-2 md:gap-4`}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
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
    </div>
  );
}

export default ProductsSection;
