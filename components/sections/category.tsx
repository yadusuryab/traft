'use client'

import React, { useEffect, useRef, useState } from 'react'
import CategoryCard from '../cards/category-card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Category = {
  name: string
  image: string
  slug: string
}

/* ── cache helpers ── */
const CACHE_KEY    = 'traft_cats_v1'
const CACHE_TTL_MS = 10 * 60 * 1000

function readCache(): Category[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    return Date.now() - ts < CACHE_TTL_MS ? data : null
  } catch { return null }
}

function writeCache(data: Category[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

/* ── skeleton ── */
function Skeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="w-24 h-24 shrink-0 rounded-xl bg-muted animate-pulse"
        />
      ))}
    </>
  )
}

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)
  const [canLeft,    setCanLeft]    = useState(false)
  const [canRight,   setCanRight]   = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  /* ── fetch ── */
  useEffect(() => {
    ;(async () => {
      const cached = readCache()
      if (cached) { setCategories(cached); setLoading(false); return }
      try {
        const res  = await fetch('/api/categories')
        const data: Category[] = await res.json()
        setCategories(data)
        writeCache(data)
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  /* ── scroll arrows ── */
  const syncArrows = () => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    syncArrows()
    el.addEventListener('scroll', syncArrows, { passive: true })
    const ro = new ResizeObserver(syncArrows)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', syncArrows); ro.disconnect() }
  }, [categories])

  const scroll = (dir: 'left' | 'right') =>
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 220 : -220, behavior: 'smooth' })

  return (
    <div className="w-full">
      {/* heading row */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg uppercase tracking-wide">Our Collections.</h2>

        {/* arrows — desktop only */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canLeft}
            aria-label="Scroll left"
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-full border border-border transition-all duration-200',
              canLeft ? 'hover:bg-accent cursor-pointer' : 'opacity-25 cursor-not-allowed'
            )}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canRight}
            aria-label="Scroll right"
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-full border border-border transition-all duration-200',
              canRight ? 'hover:bg-accent cursor-pointer' : 'opacity-25 cursor-not-allowed'
            )}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* scroll track */}
      <div className="relative">
        {/* edge fades */}
        <div className={cn(
          'pointer-events-none absolute left-0 inset-y-0 w-8 z-10 bg-gradient-to-r from-background to-transparent transition-opacity duration-300',
          canLeft ? 'opacity-100' : 'opacity-0'
        )} />
        <div className={cn(
          'pointer-events-none absolute right-0 inset-y-0 w-8 z-10 bg-gradient-to-l from-background to-transparent transition-opacity duration-300',
          canRight ? 'opacity-100' : 'opacity-0'
        )} />

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
        >
          {loading
            ? <Skeleton />
            : categories.map((cat, i) => (
                <CategoryCard key={cat.slug ?? i} {...cat} />
              ))
          }
        </div>
      </div>
    </div>
  )
}