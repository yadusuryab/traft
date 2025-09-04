import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Category } from "../sections/category";

function CategoryCard({ name, slug, image }: Category) {
  return (
    <Link
      href={`/products?category=${slug.toLowerCase()}`}
      className="group relative w-24 h-24 overflow-hidden rounded-md shadow-md"
    >
      {/* Background Image */}
      <Image
        src={image}
        alt={name}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-110"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all duration-300" />

      {/* Text */}
      <p className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm tracking-wide uppercase">
        {name}.
      </p>
    </Link>
  );
}

export default CategoryCard;
