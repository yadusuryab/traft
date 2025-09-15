import { sanityClient } from "@/lib/sanity";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    const query = `*[_type == "banner" && isActive == true][0]{
      title,
      subtitle,
      "imageUrl": image.asset->url,
      ctaText,
      ctaLink
    }`;

    const banner = await sanityClient.fetch(query);

    return NextResponse.json(banner || {});
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch banner" }, { status: 500 });
  }
}
