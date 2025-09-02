import { sanityClient } from "../sanity";

export type Product = {
  rating: number;
  _id: string;
  name: string;
  images: { url: string; title?: string }[];
  sizes?: string[];
  features?: string[];
  description?: string;
  image: string;
  price: number;
  salesPrice: number;
  featured: boolean;
};

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function getHomeProducts(): Promise<Product[]> {
  const res = await fetch(
    `${baseUrl}/api/product/home?home=true`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  console.log(data);
  return data.data || [];
}
export async function getProduct(id: string) {
  try {
    const res = await fetch(
      `${baseUrl}/api/product/${id}`,
      
    );
    console.log(res)
    if (!res.ok) {
      // product not found or error from API
      return null;
    }

    const product = await res.json();

    // product.images is already transformed in your API route as array of URLs
    return product;
  } catch (error) {
    console.error("Failed to fetch product from API", error);
    return null;
  }
}
