import React from "react";
import Brand from "../utils/brand";
import { Button, buttonVariants } from "../ui/button";
import { ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";

function Header() {
  return (
    <header className="flex justify-between items-center px-4 py-2 border-b fixed z-50 top-0 left-0 right-0 bg-background backdrop-blur-md">
       <Link  href="/track-order"  className={buttonVariants({size:'icon',variant:'ghost'})}>
          <Truck /> 
        </Link>
      <div>
        <Link  href="/">
        <Brand />
        </Link>
      </div>
      <div className="flex gap-2">
       
      
        <Link href="/cart" className={buttonVariants({size:'icon',variant:'ghost'})}>
          <ShoppingBag />
        </Link>
      </div>
    </header>
  );
}

export default Header;
