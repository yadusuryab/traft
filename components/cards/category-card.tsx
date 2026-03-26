import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Category } from "../sections/category";

function CategoryCard({ name, slug, image }: Category) {
  return (
    <Link
      href={`/products?category=${slug.toLowerCase()}`}
      className="group relative w-24 h-24 shrink-0 overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* Background Image */}
      <Image
        src={image}
        alt={name}
        fill
        sizes="96px"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 group-hover:from-black/55 group-hover:via-black/20 transition-all duration-300" />

      {/* Text */}
      <p className="absolute inset-0 flex items-center justify-center text-white font-semibold text-[11px] tracking-widest uppercase text-center px-1 leading-tight drop-shadow-sm">
        {name}
      </p>
    </Link>
  );
}

export default CategoryCard;