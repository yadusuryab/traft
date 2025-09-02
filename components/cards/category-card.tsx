import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Category } from '../sections/category'



function CategoryCard({ name,slug, image }: Category) {
  return (
    <div className="flex relative  flex-col items-center gap-2">
      <Link href={`/products?category=${slug.toLowerCase()}`}>
      <div className="w-20 h-20 relative rounded-full shadow-md border">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover rounded-xl"
        />
      </div>
      <p className="absolute shadow-md -bottom-1 right-1 left-1 bg-background/75 backdrop-blur-2xl w-fit p-1 rounded-full mx-auto text-xs font-medium text-center">{name}</p>
      </Link>
    </div>
  )
}

export default CategoryCard
