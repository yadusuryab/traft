import React from "react";
import Link from "next/link";
import { PhoneCall } from "lucide-react";
import BrandIcon from "../utils/brand-icon";
import { Button } from "../ui/button";
import Image from "next/image";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background mt-10 w-full">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-t pt-5 md:px-28 px-5 gap-6">
        {/* Brand and Navigation Links */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 flex-wrap w-full md:w-auto justify-center md:justify-start">
          <div className="flex items-center justify-center">
            <BrandIcon />
          </div>
          <nav className="flex gap-6 flex-wrap justify-center text-muted-foreground">
            <Link
              href="/terms"
              aria-label="Terms"
              className="hover:text-foreground hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              aria-label="Privacy"
              className="hover:text-foreground hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/contact"
              aria-label="Contact"
              className="hover:text-foreground hover:underline"
            >
              Contact
            </Link>
          </nav>
        </div>

        {/* Contact Section */}
        <div className="flex justify-center md:justify-end w-full md:w-auto">
          <Link href={`tel:${process.env.NEXT_PUBLIC_PHONE}`}>
            <Button
              variant="link"
              className="text-primary font-bold text-lg flex items-center gap-2"
            >
              <PhoneCall /> {process.env.NEXT_PUBLIC_PHONE}
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:justify-between py-5 px-5 md:px-28  text-muted-foreground text-sm">
        <Link
          href="https://instagram.com/getshopigo"
          className="hover:text-foreground hover:underline "
        >
          <Image
            src={"/shopigo.avif"}
            width={80}
            height={30}
            alt={process.env.NEXT_PUBLIC_APP_NAME || "SHOPIGO"}
          />
        </Link>
        <p>
          &copy; {currentYear}, {process.env.NEXT_PUBLIC_APP_NAME}.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
