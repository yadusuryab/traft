import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import PriceFormat_Sale from '../commerce-ui/price-format-sale'
import { Badge } from '../ui/badge' // Assuming you're using shadcn/ui
import StarRating_Basic from '../commerce-ui/star-rating-basic'

type Props = {
  id: string
  name: string
  imageUrl: string
  price: number
  salesPrice: number
  isNew?: boolean
  isBestSeller?: boolean
  rating?:number
}

function ProductCard({ id, name, imageUrl, salesPrice, price, isNew = false, isBestSeller = false, rating = 0 }: Props) {
  return (
    <Link href={`/product/${id.toLowerCase()}`} passHref>
      <motion.div 
        className="relative group"
        whileHover={{ y: -5 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <div className="relative h-80 w-full overflow-hidden shadow-lg bg-gray-50">
          {/* Product Image with subtle overlay */}
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Status Badges */}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
            {isNew && (
              <Badge variant="new" className="px-3 py-1 text-xs font-medium">
                New Arrival
              </Badge>
            )}
            {isBestSeller && (
              <Badge variant="bestSeller" className="px-3 py-1 text-xs font-medium">
                Best Seller
              </Badge>
            )}
          </div>

          {/* Quick View Button (appears on hover) */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity"
          >
            <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-white/90 transition-colors">
              Quick View
            </button>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="mt-4 space-y-1">
          <h3 className="font-medium  truncate">{name}</h3>
          <StarRating_Basic value={rating} readOnly iconSize={12} className='fill-primary'/>
          <div className="flex items-center gap-2">
            <PriceFormat_Sale
              originalPrice={price}
              salePrice={salesPrice}
              prefix="₹"
              showSavePercentage={true}
              classNameOriginalPrice="text-sm text-gray-500 line-through"
              classNameSalePrice="text-lg font-semibold"
              className="flex items-center gap-2"
            />
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default ProductCard