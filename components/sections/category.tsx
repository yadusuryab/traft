'use client'

import React, { useEffect, useState } from 'react'
import CategoryCard from '../cards/category-card'

export type Category = {
  name: string
  image: string
  slug: string
  
}

function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Check localStorage for cache
        const cached = localStorage.getItem('categories_cache')
        const cacheTime = localStorage.getItem('categories_cache_time')
        const now = new Date().getTime()

        if (cached && cacheTime && now - parseInt(cacheTime) < 1000 * 60 * 10) {
          // Cache valid for 10 minutes
          setCategories(JSON.parse(cached))
        } else {
          const res = await fetch('/api/categories')
          const data = await res.json()
          setCategories(data)

          // Store in cache
          localStorage.setItem('categories_cache', JSON.stringify(data))
          localStorage.setItem('categories_cache_time', now.toString())
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }

    fetchCategories()
  }, [])

  return (
    <div className="bg-secondary border   mx-2 py-2">
      <h2 className="text-xl tracking-tight italic font-serif mb-3 px-4">
        Traft Collections.
      </h2>
      <div className="flex gap-4 overflow-x-auto max-w-[360px] md:max-w-full whitespace-nowrap pb-2 px-4 md:justify-start">
        {categories.map((cat, i) => (
          <CategoryCard key={i} {...cat} />
        ))}
      </div>
    </div>
  )
}

export default CategorySection
