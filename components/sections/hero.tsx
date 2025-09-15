"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

type Banner = {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
};

export default function Hero() {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch("/api/banner");
        const data = await res.json();
        setBanner(data);
      } catch (err) {
        console.error("Error fetching banner:", err);
      }
    };
    fetchBanner();
  }, []);

  if (!banner) return null; // or skeleton loader

  return (
    <div className="w-full h-[25vh] min-h-[200px] max-h-[250px] relative overflow-hidden">
      {banner.imageUrl && (
        <Image
          src={banner.imageUrl}
          alt={banner.title || "Banner"}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
        {banner.title && (
          <h2 className="text-lg font-bold drop-shadow-md">{banner.title}</h2>
        )}
        {banner.subtitle && (
          <p className="text-sm mt-1 drop-shadow-md">{banner.subtitle}</p>
        )}
        {banner.ctaText && banner.ctaLink && (
          <Button
            size="sm"
            className="mt-2 bg-primary text-white hover:bg-primary/90 px-4 py-2 text-sm"
            asChild
          >
            <Link href={banner.ctaLink}>
              {banner.ctaText}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
