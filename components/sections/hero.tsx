'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Slide1 from '@/public/stylezone-slide.jpeg';

export default function Hero() {
  return (
    <div className="w-full h-[25vh] min-h-[200px] max-h-[250px] relative overflow-hidden">
      <Image
        src={Slide1}
        alt="StyleZone Fashion Collection"
        fill
        sizes="100vw"
        priority
        className="object-cover"
      />
      
      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-md space-y-2 text-white">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">
              Discover Your
              <span className="block bg-primary text-primary-foreground w-fit">Unique Style</span>
            </h1>
            
            <p className="text-sm md:text-base text-gray-200 max-w-xs">
              Elevate your wardrobe with our latest collection
            </p>
            
            <Button 
              size="sm" 
              className="bg-primary text-white hover:bg-primary/90 px-4 py-2 text-sm mt-2"
              asChild
            >
              <Link href="/products">
                Shop Now
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}