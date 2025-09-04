"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/lib/queries/product";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ProductsSection from "@/components/sections/products";
import { cn } from "@/lib/utils";

function ProductsPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    Array<{ _id: string; name: string; slug: string }>
  >([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Initialize filters from URL or defaults
  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    minPrice: parseInt(searchParams.get("minPrice") || "0"),
    maxPrice: parseInt(searchParams.get("maxPrice") || "20000"),
    category: searchParams.get("category") || "",
    sort: searchParams.get("sort") || "newest",
    page: parseInt(searchParams.get("page") || "1"),
    limit: 12,
  });
  
  const [pagination, setPagination] = useState({
    total: 0,
    hasNextPage: false,
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Update URL when filters change
 // Update URL when filters change
useEffect(() => {
  const params = new URLSearchParams();
  
  // Add this line to include the search query in the URL
  if (filters.q) params.set("q", filters.q);
  
  if (filters.minPrice > 0)
    params.set("minPrice", filters.minPrice.toString());
  if (filters.maxPrice < 100000)
    params.set("maxPrice", filters.maxPrice.toString());
  if (filters.category) params.set("category", filters.category);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", filters.page.toString());

  router.replace(`/products?${params.toString()}`, { scroll: false });
}, [filters, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      console.log(filters.q)
      if (filters.q) params.append("q", filters.q);
      params.append("minPrice", filters.minPrice.toString());
      params.append("maxPrice", filters.maxPrice.toString());
      if (filters.category) params.append("category", filters.category);
      params.append("sort", filters.sort);
      params.append("page", filters.page.toString());
      params.append("limit", filters.limit.toString());

      const response = await fetch(`/api/product?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setPagination({
          total: data.pagination.total,
          hasNextPage: data.pagination.hasNextPage,
        });
      } else {
        throw new Error(data.message || "Failed to fetch products");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const handlePriceChange = (value: number[]) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: value[0],
      maxPrice: value[1],
      page: 1,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      category: value,
      page: 1,
    }));
  };

  const handleSortChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      sort: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="container mx-auto  py-8">
      {/* Mobile Filters Button */}
      <div className="md:hidden flex justify-between  items-center mb-6">
        <h1 className="text-2xl font-bold">Fresh Drops</h1>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>
      <div className=" md:px-0 mb-6">
    <input
      type="text"
      placeholder="Search products..."
      value={filters.q}
      onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value, page: 1 }))}
      className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Mobile Filters Overlay */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 bg-accent p-6 overflow-y-auto md:hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Filters</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-8">
                {/* Price Range */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Price Range (₹)</h4>
                  <Slider
                    min={0}
                    max={50000} // Adjusted max price to 50,000 INR (common for e-commerce)
                    step={500} // Increments of 500 INR
                    value={[filters.minPrice, filters.maxPrice]}
                    onValueChange={handlePriceChange}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm">
                    <span>₹{filters.minPrice.toLocaleString("en-IN")}</span>
                    <span>₹{filters.maxPrice.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Categories</h4>
                  <Select
                    value={filters.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category.slug}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Sort By</h4>
                  <Select value={filters.sort} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest Drops</SelectItem>
                      <SelectItem value="price-asc">
                        Price: Low to High
                      </SelectItem>
                      <SelectItem value="price-desc">
                        Price: High to Low
                      </SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Filters Sidebar */}
        <div className="hidden md:block w-72 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-accent p-6 rounded-xl shadow-sm sticky top-4 border "
          >
            <h3 className="font-bold text-xl mb-6">✨ Filter By</h3>

            {/* Price Range */}
            <div className="mb-8">
              <h4 className="text-sm font-medium mb-4">Price Range</h4>
              <Slider
                min={0}
                max={10000}
                step={10}
                value={[filters.minPrice, filters.maxPrice]}
                onValueChange={handlePriceChange}
                className="mb-4"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>₹{filters.minPrice}</span>
                <span>₹{filters.maxPrice}</span>
              </div>
            </div>

            {/* Categories */}
            <div className="mb-8">
              <h4 className="text-sm font-medium mb-4">Categories</h4>
              <Select
                value={filters.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <h4 className="text-sm font-medium mb-4">Sort By</h4>
              <Select value={filters.sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest Drops</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 text-red-600 p-4 rounded-lg"
            >
              {error}
            </motion.div>
          ) : (
            <>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <ProductsSection
                  products={products}
                  deskCols={3}
                  title={
                    filters.category
                      ? `${
                          categories.find((c) => c.slug === filters.category)
                            ?.name
                        } Collection`
                      : "The Drop Zone"
                  }
                  desc={
                    filters.category
                      ? "Curated just for your style"
                      : "Discover the latest trends just for you"
                  }
                  showViewAll={false}
                />
              </motion.div>

              {/* Pagination */}
              {pagination.total > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center mt-12 gap-2"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page === 1}
                    onClick={() => handlePageChange(filters.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({
                    length: Math.min(
                      5,
                      Math.ceil(pagination.total / filters.limit)
                    ),
                  }).map((_, i) => {
                    let pageNum;
                    if (Math.ceil(pagination.total / filters.limit) <= 5) {
                      pageNum = i + 1;
                    } else if (filters.page <= 3) {
                      pageNum = i + 1;
                    } else if (
                      filters.page >=
                      Math.ceil(pagination.total / filters.limit) - 2
                    ) {
                      pageNum =
                        Math.ceil(pagination.total / filters.limit) - 4 + i;
                    } else {
                      pageNum = filters.page - 2 + i;
                    }

                    return (
                      <Button
                        key={i}
                        variant={
                          filters.page === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage}
                    onClick={() => handlePageChange(filters.page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading filters...</div>}>
      <ProductsPageComponent />
    </Suspense>
  );
}
