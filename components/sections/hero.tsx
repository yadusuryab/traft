'use client';
import Image from 'next/image';
import Slide1 from '@/public/stylezone-slide.jpeg'; // use whatever your main image is

export default function Hero() {
  return (
    <div className="w-full h-[400px] md:h-[500px] relative">
      <Image
        src={Slide1}
        alt="Hero Banner"
        fill
        sizes="100vw"
        priority
        className="object-cover"
      />
    </div>
  );
}
