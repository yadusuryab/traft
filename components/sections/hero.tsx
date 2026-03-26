"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Banner = {
  id: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
};

/* ─── Skeleton shown while banners load ─── */
function HeroSkeleton() {
  return (
    <div className="w-full h-[25vh] min-h-[200px] max-h-[250px] bg-muted animate-pulse rounded-none" />
  );
}

export default function Hero() {
  const [banners, setBanners]           = useState<Banner[]>([]);
  const [loading, setLoading]           = useState(true);
  const [current, setCurrent]           = useState(0);
  const [prev,    setPrev]              = useState<number | null>(null);
  const [dir,     setDir]               = useState<"left" | "right">("right");
  const [animating, setAnimating]       = useState(false);
  const [paused,  setPaused]            = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Fetch ── */
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch("/api/banner");
        const data = await res.json();
        setBanners(Array.isArray(data) ? data : [data]);
      } catch (e) {
        console.error("Error fetching banners:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Slide transition helper ── */
  const slideTo = useCallback(
    (next: number, direction: "left" | "right") => {
      if (animating || next === current) return;
      setDir(direction);
      setPrev(current);
      setCurrent(next);
      setAnimating(true);
      setTimeout(() => {
        setPrev(null);
        setAnimating(false);
      }, 500);
    },
    [animating, current]
  );

  const goNext = useCallback(() => {
    slideTo((current + 1) % banners.length, "right");
  }, [current, banners.length, slideTo]);

  const goPrev = useCallback(() => {
    slideTo(current === 0 ? banners.length - 1 : current - 1, "left");
  }, [current, banners.length, slideTo]);

  /* ── Auto-play ── */
  useEffect(() => {
    if (paused || banners.length <= 1) return;
    timerRef.current = setInterval(goNext, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, banners.length, goNext]);

  /* ── Progress bar width ── */
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (paused || banners.length <= 1) { setProgress(0); return; }
    setProgress(0);
    const start = performance.now();
    const RAF_DURATION = 5000;
    let raf: number;
    const tick = (now: number) => {
      const pct = Math.min(((now - start) / RAF_DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current, paused, banners.length]);

  if (loading) return <HeroSkeleton />;
  if (!banners.length) return null;

  const multi = banners.length > 1;

  /* ── Slide animation classes ── */
  const enterClass = dir === "right"
    ? "animate-slide-in-right"
    : "animate-slide-in-left";
  const exitClass = dir === "right"
    ? "animate-slide-out-left"
    : "animate-slide-out-right";

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes slide-in-right  { from { transform: translateX(6%);  opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slide-in-left   { from { transform: translateX(-6%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slide-out-left  { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-6%); opacity: 0; } }
        @keyframes slide-out-right { from { transform: translateX(0); opacity: 1; } to { transform: translateX(6%);  opacity: 0; } }
        @keyframes hero-content-up { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-in-right  { animation: slide-in-right  0.5s cubic-bezier(.4,0,.2,1) forwards; }
        .animate-slide-in-left   { animation: slide-in-left   0.5s cubic-bezier(.4,0,.2,1) forwards; }
        .animate-slide-out-left  { animation: slide-out-left  0.5s cubic-bezier(.4,0,.2,1) forwards; }
        .animate-slide-out-right { animation: slide-out-right 0.5s cubic-bezier(.4,0,.2,1) forwards; }
        .animate-hero-content    { animation: hero-content-up 0.55s 0.15s cubic-bezier(.4,0,.2,1) both; }
      `}</style>

      <div
        className="relative w-full h-[25vh] min-h-[200px] rounded max-h-[250px] overflow-hidden bg-muted select-none"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* ── Slides ── */}
        {banners.map((banner, i) => {
          const isCurrent = i === current;
          const isPrev    = i === prev;
          if (!isCurrent && !isPrev) return null;

          return (
            <div
              key={banner.id}
              className={cn(
                "absolute inset-0",
                isCurrent && animating && enterClass,
                isPrev    && animating && exitClass,
                isCurrent && !animating && "opacity-100",
                isPrev    && !animating && "opacity-0 pointer-events-none"
              )}
            >
              {/* Image */}
              {banner.imageUrl ? (
                <Image
                  src={banner.imageUrl}
                  alt={banner.title || "Banner"}
                  fill
                  sizes="100vw"
                  priority={i === 0}
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40" />
              )}

              {/* Gradient overlay — bottom-heavy for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Content — only animate on current visible slide */}
              {isCurrent && (
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 text-center animate-hero-content">
                  {banner.title && (
                    <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold drop-shadow-lg leading-tight max-w-2xl">
                      {banner.title}
                    </h2>
                  )}
                  {banner.subtitle && (
                    <p className="text-white/85 text-sm sm:text-base mt-2 drop-shadow max-w-xl leading-relaxed">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.ctaText && banner.ctaLink && (
                    <Button
                      size="sm"
                      className="mt-4 rounded-full px-6 h-9 text-sm font-semibold shadow-lg hover:scale-105 active:scale-95 transition-transform duration-200"
                      asChild
                    >
                      <Link href={banner.ctaLink}>
                        {banner.ctaText}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Prev / Next arrows ── */}
        {multi && (
          <>
            <button
              onClick={() => { goPrev(); setPaused(false); }}
              aria-label="Previous"
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 z-10",
                "flex items-center justify-center w-8 h-8 rounded-full",
                "bg-black/30 hover:bg-black/55 text-white backdrop-blur-sm",
                "transition-all duration-200 hover:scale-110 active:scale-95"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => { goNext(); setPaused(false); }}
              aria-label="Next"
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 z-10",
                "flex items-center justify-center w-8 h-8 rounded-full",
                "bg-black/30 hover:bg-black/55 text-white backdrop-blur-sm",
                "transition-all duration-200 hover:scale-110 active:scale-95"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* ── Dot indicators ── */}
        {multi && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => { slideTo(i, i > current ? "right" : "left"); setPaused(false); }}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === current
                    ? "bg-white w-5 h-1.5"
                    : "bg-white/45 hover:bg-white/70 w-1.5 h-1.5"
                )}
              />
            ))}
          </div>
        )}

        {/* ── Progress bar (auto-play progress) ── */}
        {multi && !paused && (
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white/15 z-10 overflow-hidden">
            <div
              className="h-full bg-white/60 transition-none rounded-r-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </>
  );
}