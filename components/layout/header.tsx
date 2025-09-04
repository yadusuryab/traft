"use client";
import React, { useState } from "react";
import Brand from "../utils/brand";
import { buttonVariants } from "../ui/button";
import { ShoppingBag, Truck, Search, X } from "lucide-react";
import Link from "next/link";
import { Input } from "../ui/input";
import { useRouter, usePathname } from "next/navigation";

function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const isHomePage = pathname === "/" ;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const clearSearch = () => setSearchQuery("");

  return (
    <header className="bg-background backdrop-blur-md fixed w-full px-4 py-3 border-b z-50 top-0 left-0 right-0">
      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <Link
            href="/track-order"
            className={buttonVariants({ size: "icon", variant: "ghost" })}
          >
            <Truck size={20} />
          </Link>

          <Link href="/" className="flex-shrink-0">
            <Brand />
          </Link>

          <Link
            href="/cart"
            className={buttonVariants({ size: "icon", variant: "ghost" })}
          >
            <ShoppingBag size={20} />
          </Link>
        </div>

        {isHomePage && (
          <form onSubmit={handleSearch} className="relative">
            <Input
              placeholder="Search our store..."
              className="h-9 w-full bg-secondary border-none rounded-full pr-10 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-1 mr-1 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <Search size={16} />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between gap-4">
        <Link
          href="/track-order"
          className={buttonVariants({ size: "icon", variant: "ghost" })}
        >
          <Truck size={20} />
        </Link>

        <Link href="/" className="flex-shrink-0">
          <Brand />
        </Link>

        {isHomePage && (
          <form
            onSubmit={handleSearch}
            className="relative flex-1 max-w-xl mx-6"
          >
            <Input
              placeholder="Search our store..."
              className="h-10 w-full bg-secondary border-none rounded-full pr-10 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-1 mr-1 text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <Search size={18} />
              </button>
            </div>
          </form>
        )}

        <Link
          href="/cart"
          className={buttonVariants({ size: "icon", variant: "ghost" })}
        >
          <ShoppingBag size={20} />
        </Link>
      </div>
    </header>
  );
}

export default Header;
