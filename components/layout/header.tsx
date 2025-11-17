"use client";
import React, { useState } from "react";
import Brand from "../utils/brand";
import { buttonVariants } from "../ui/button";
import { ShoppingBag, Truck, Search, X, Menu, Home, FileText, Info } from "lucide-react";
import Link from "next/link";
import { Input } from "../ui/input";
import { useRouter, usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "../ui/sheet";
import { cn } from "../../lib/utils";

function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const isHomePage = pathname === "/";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const clearSearch = () => setSearchQuery("");

  const navigationItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Track Order", href: "/track-order", icon: Truck },
    { name: "Cart", href: "/cart", icon: ShoppingBag },
    { name: "Return Policy", href: "/terms", icon: FileText },
  ];

  return (
    <header className="bg-background backdrop-blur-md fixed w-full px-4 py-3 border-b z-50 top-0 left-0 right-0">
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button - Left side on mobile */}
        <div className="md:hidden flex items-center">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={buttonVariants({ size: "icon", variant: "ghost" })}
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-center p-4 border-b">
                  <Brand />
                </div>
                <nav className="flex-1 p-4">
                  <ul className="space-y-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.name}>
                          <SheetClose asChild>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-md text-sm font-medium transition-colors",
                                pathname === item.href
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              <Icon size={18} />
                              {item.name}
                            </Link>
                          </SheetClose>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
                <div className="p-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME}
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Brand Logo - Center on mobile, left on desktop */}
        <div className="flex-1 md:flex-none flex justify-center md:justify-start">
          <Link href="/" className="flex-shrink-0 z-10">
            <Brand />
          </Link>
        </div>

        {/* Desktop Search - Center */}
        {isHomePage && (
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8 relative">
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

        {/* Desktop Navigation - Right side */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={buttonVariants({ variant: pathname === "/" ? "default" : "ghost", size: "sm" })}
          >
            Home
          </Link>
          <Link
            href="https://track.traft.in"
            target="_blank"
          >
            Track Order
          </Link>
          <Link
            href="/terms"
            className={buttonVariants({ variant: pathname === "/terms" ? "default" : "ghost", size: "sm" })}
          >
            Terms
          </Link>
          <Link
            href="/cart"
            className={buttonVariants({ size: "icon", variant: "ghost" })}
          >
            <ShoppingBag size={20} />
          </Link>
        </div>

        {/* Mobile Cart - Right side on mobile */}
        <div className="md:hidden flex items-center">
          <Link
            href="/cart"
            className={buttonVariants({ size: "icon", variant: "ghost" })}
          >
            <ShoppingBag size={20} />
          </Link>
        </div>
      </div>

      {/* Mobile Search (appears below header on home page) */}
      {isHomePage && (
        <div className="md:hidden mt-3">
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
        </div>
      )}
    </header>
  );
}

export default Header;