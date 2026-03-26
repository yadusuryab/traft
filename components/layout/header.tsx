"use client";

import React, { useState, useEffect, useRef } from "react";
import Brand from "../utils/brand";
import { Button } from "../ui/button";
import {
  ShoppingBag,
  Truck,
  Search,
  X,
  FileText,
  Tag,
  Zap,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Input } from "../ui/input";
import { useRouter, usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "../ui/sheet";
import { cn } from "../../lib/utils";

/* ────────────────────────────────────────────
   Marquee Items
──────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  { icon: Truck, text: "Welcome To Traftshoppe." },
  { icon: Zap,   text: "Quality Products at Best Price." },

];

/* ────────────────────────────────────────────
   Marquee
──────────────────────────────────────────── */
function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="w-full bg-primary text-primary-foreground h-8 overflow-hidden flex items-center select-none">
      <div
        className="flex items-center whitespace-nowrap"
        style={{
          animation: "traft-marquee 36s linear infinite",
          willChange: "transform",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
        onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
      >
        {doubled.map((item, i) => {
          const Icon = item.icon;
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-8 text-[11.5px] font-medium tracking-wide"
            >
              <Icon size={12} className="opacity-75 shrink-0" />
              {item.text}
              <span className="ml-6 opacity-30 text-[8px]">✦</span>
            </span>
          );
        })}
      </div>
      <style>{`
        @keyframes traft-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes traft-badge {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────
   Header
──────────────────────────────────────────── */
export default function Header({ cartCount = 0 }: { cartCount?: number }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [q,              setQ]              = useState("");
  const [scrolled,       setScrolled]       = useState(false);
  const [sheetOpen,      setSheetOpen]      = useState(false);
  const [mobileSearch,   setMobileSearch]   = useState(false);
  const mobileRef = useRef<HTMLInputElement>(null);

  const isHome = pathname === "/";

  useEffect(() => {
    const cb = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", cb, { passive: true });
    return () => window.removeEventListener("scroll", cb);
  }, []);

  useEffect(() => {
    if (mobileSearch) setTimeout(() => mobileRef.current?.focus(), 80);
  }, [mobileSearch]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/products?q=${encodeURIComponent(q.trim())}`);
      setMobileSearch(false);
    }
  };

  const navLinks = [
    { label: "Home",          href: "/",                      icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px]"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg> },
    { label: "Track Order",   href: "https://track.traft.in", icon: Truck,    external: true },
    { label: "Return Policy", href: "/terms",                 icon: FileText  },
  ];

  return (
    <>
      {/* ── Fixed wrapper ── */}
      <div
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-shadow duration-300",
          scrolled ? "shadow-[0_2px_24px_-4px_rgba(0,0,0,0.13)]" : "shadow-none"
        )}
      >
        {/* Marquee */}
        <Marquee />

        {/* Header bar */}
        <header className="bg-background/90 backdrop-blur-md border-b border-border/70">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-2 relative">

            {/* ── [A] Hamburger — mobile only, absolute left ── */}
            <div className="flex md:hidden absolute left-4 top-1/2 -translate-y-1/2">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu" className="rounded-xl w-9 h-9">
                    <span className="flex flex-col gap-[5px] w-[18px]">
                      <span className={cn(
                        "block h-[1.5px] bg-foreground rounded-full transition-all duration-300 origin-center",
                        sheetOpen && "translate-y-[6.5px] rotate-45"
                      )} />
                      <span className={cn(
                        "block h-[1.5px] bg-foreground rounded-full transition-all duration-200",
                        sheetOpen && "opacity-0 scale-x-0"
                      )} />
                      <span className={cn(
                        "block h-[1.5px] bg-foreground rounded-full transition-all duration-300 origin-center",
                        sheetOpen && "-translate-y-[6.5px] -rotate-45"
                      )} />
                    </span>
                  </Button>
                </SheetTrigger>

                <SheetContent side="left" className="w-72 p-0 flex flex-col gap-0">
                  <div className="flex items-center justify-center h-16 border-b px-4 shrink-0">
                    <Brand />
                  </div>
                  <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {navLinks.map(({ label, href, icon: Icon, external }) => (
                      <SheetClose asChild key={label}>
                        <Link
                          href={href}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noreferrer" : undefined}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150",
                            pathname === href
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-accent"
                          )}
                        >
                          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary shrink-0">
                            <Icon size={15} />
                          </span>
                          {label}
                          <ChevronRight size={13} className="ml-auto opacity-25" />
                        </Link>
                      </SheetClose>
                    ))}
                    <SheetClose asChild>
                      <Link
                        href="/cart"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors duration-150"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary shrink-0">
                          <ShoppingBag size={15} />
                        </span>
                        Cart
                        {cartCount > 0 && (
                          <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {cartCount}
                          </span>
                        )}
                        <ChevronRight size={13} className="ml-auto opacity-25" />
                      </Link>
                    </SheetClose>
                  </nav>
                  <div className="shrink-0 p-4 border-t space-y-3">
                    <a
                      href="https://track.traft.in"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 h-10 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Truck size={14} /> Track my order
                    </a>
                    <p className="text-center text-[11px] text-muted-foreground">
                      © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME}
                    </p>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* ── [B] Brand — absolute-centred on mobile, normal flow on desktop ── */}
            <Link
              href="/"
              className={cn(
                // mobile: truly centred in header regardless of icon sizes
                "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2",
                // desktop: back to normal flow
                "md:static md:translate-x-0 md:translate-y-0 md:left-auto md:top-auto",
                "shrink-0 transition-opacity duration-150 hover:opacity-80 active:scale-95"
              )}
            >
              <Brand />
            </Link>

            {/* ── [C] Desktop search — takes remaining space ── */}
            {isHome && (
              <form
                onSubmit={submit}
                className="hidden md:flex flex-1 mx-6"
              >
                <div className="relative flex w-full items-center rounded-full bg-secondary border border-transparent focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 overflow-hidden h-10">
                  <Search
                    size={14}
                    className="absolute left-4 text-muted-foreground pointer-events-none shrink-0"
                  />
                  <Input
                    placeholder="Search products, brands and more…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="h-full bg-transparent border-none shadow-none ring-0 focus-visible:ring-0 pl-10 pr-[88px] text-sm rounded-none"
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ("")}
                      aria-label="Clear"
                      className="absolute right-[82px] flex items-center text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      <X size={13} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute right-0 h-full px-5 bg-primary text-primary-foreground text-xs font-semibold tracking-wide rounded-r-full hover:opacity-90 transition-opacity"
                  >
                    Search
                  </button>
                </div>
              </form>
            )}

            {/* ── [D] Desktop nav ── */}
            <nav className="hidden md:flex items-center gap-0.5 ml-auto shrink-0">
              {[{ label: "Home", href: "/" }, { label: "Terms", href: "/terms" }].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "relative px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150",
                    "after:absolute after:bottom-0.5 after:left-3 after:right-3 after:h-[2px] after:rounded-full",
                    "after:bg-primary after:transition-transform after:duration-200 after:origin-left",
                    pathname === href
                      ? "text-primary after:scale-x-100"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50 after:scale-x-0 hover:after:scale-x-100"
                  )}
                >
                  {label}
                </Link>
              ))}
              <a
                href="https://track.traft.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors duration-150"
              >
                <Truck size={13} className="opacity-70" />
                Track Order
              </a>
              <Link
                href="/cart"
                aria-label="Cart"
                className="relative ml-1 flex items-center justify-center w-9 h-9 rounded-xl hover:bg-accent transition-colors duration-150 active:scale-95"
              >
                <ShoppingBag size={19} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full px-1 border-2 border-background"
                    style={{ animation: "traft-badge 0.3s cubic-bezier(.34,1.56,.64,1) forwards" }}
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            </nav>

            {/* ── [E] Mobile right: search + cart ── */}
            <div className="flex md:hidden items-center gap-1 absolute right-4 top-1/2 -translate-y-1/2">
              {isHome && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl w-9 h-9"
                  aria-label="Search"
                  onClick={() => setMobileSearch(true)}
                >
                  <Search size={19} />
                </Button>
              )}
              <Link
                href="/cart"
                aria-label="Cart"
                className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-accent transition-colors active:scale-95"
              >
                <ShoppingBag size={19} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full px-1 border-2 border-background"
                    style={{ animation: "traft-badge 0.3s cubic-bezier(.34,1.56,.64,1) forwards" }}
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </header>
      </div>

      {/* ── Mobile search overlay — slides down from below marquee ── */}
      <div
        className={cn(
          "fixed inset-x-0 z-[60] bg-background/90 backdrop-blur-sm border-b border-border",
          "flex items-center gap-3 px-4 h-16",
          "transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]",
          mobileSearch
            ? "top-8 opacity-100 pointer-events-auto "
            : "top-0 opacity-0 pointer-events-none -translate-y-full"
        )}
        role="dialog"
        aria-label="Search"
      >
        <form
          onSubmit={submit}
          className="flex flex-1 items-center gap-2 bg-secondary rounded-xl px-3 h-10"
        >
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            ref={mobileRef}
            placeholder="Search products, brands…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground min-w-0"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear"
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </form>
        <button
          onClick={() => setMobileSearch(false)}
          className="shrink-0 text-sm font-semibold text-primary px-1 py-1"
        >
          Cancel
        </button>
      </div>
    </>
  );
}