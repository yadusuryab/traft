import React from "react";
import ImageCarousel_Basic, {
  CarouselImages,
} from "@/components/commerce-ui/image-carousel-basic";
import PriceFormat_Sale from "@/components/commerce-ui/price-format-sale";
import ProductReviewSection from "@/components/sections/reviews";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/lib/queries/product";
import AddToCartButton from "@/components/utils/add-to-cart";
import ProductBuySection from "@/components/sections/product-add-to-cart";
import StarRating_Basic from "@/components/commerce-ui/star-rating-basic";
import { Metadata, ResolvingMetadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    };
  }

  const previousImages = (await parent).openGraph?.images || [];
  const productImage = product.images?.[0]?.url || '';

  return {
    title: `${product.name} | ${product.category} | ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: product.description || `${product.name} - Available now at ${process.env.NEXT_PUBLIC_APP_NAME}`,
    keywords: [
      product.name,
      product.category,
      ...(product.tags || []),
      "buy online",
      "ecommerce",
    ].join(", "),
    openGraph: {
      title: product.name,
      description: product.description || `${product.name} available for purchase`,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/product/${id}`,
      type: "website", // Changed from "product" to "website" which is allowed
      images: productImage ? [productImage, ...previousImages] : previousImages,
      // Add product-specific data as additional properties
      ...(product.price && {
        'product:price:amount': product.salesPrice || product.price,
        'product:price:currency': 'INR',
      }),
      ...(product.brand && {
        'product:brand': product.brand,
      }),
      ...(productImage && {
        'product:image': productImage,
      }),
      ...(product.sku && {
        'product:retailer_item_id': product.sku,
      }),
      ...(product.availability && {
        'product:availability': product.availability,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description || `${product.name} available for purchase`,
      images: productImage ? [productImage] : [],
      // Twitter specific product tags
      ...(product.price && {
        'twitter:label1': 'Price',
        'twitter:data1': `₹${product.salesPrice || product.price}`,
      }),
      ...(product.availability && {
        'twitter:label2': 'Availability',
        'twitter:data2': product.stock > 0 ? 'In Stock' : 'Out of Stock',
      }),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_NAME}/product/${id}`,
    },
  };
}

const ProductPage = async ({ params }: Props) => {
  const { id } =await params;
  const product = await getProduct(id);

  if (!product) {
    return <p className="p-4 text-center text-red-600">Product not found.</p>;
  }

  // Add structured data for rich snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images?.[0]?.url || "",
    description: product.description,
    brand: {
      "@type": "Brand",
      name: product.brand || "Your Store Brand",
    },
    sku: product.sku || id,
    mpn: product.sku || id,
    review: {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: product.rating?.toString() || '5',
        bestRating: "5",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating?.toString() || '5',
      reviewCount: product.reviewCount?.toString() || "0",
    },
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_APP_NAME}/product/${id}`,
      priceCurrency: "INR",
      price: product.salesPrice || product.price,
      priceValidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0], // 30 days from now
      itemCondition: "https://schema.org/NewCondition",
      availability: product.stock > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="min-h-screen pt-4">
      {/* Add structured data to the page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="grid md:grid-cols-2 gap-4">
        <ImageCarousel_Basic
          images={product.images}
          imageFit="contain"
          classNameImage={"object-fit-contain"}
        />
        <div>
          <h1 className="md:text-2xl text-xl font-medium tracking-tight">
            {product.name}
          </h1>
          <div className="mt-4">
            <StarRating_Basic value={product.rating} readOnly iconSize={18} />
            <span className="ml-2 text-sm text-muted-foreground">
              {product.reviewCount || 0} reviews
            </span>
          </div>
          <div className="mt-4">
            {product.salesPrice ? (
              <>
                <span className="font-semibold text-primary mt-2 text-sm">
                  Special Price
                </span>
                <PriceFormat_Sale
                  originalPrice={product.price}
                  salePrice={product.salesPrice}
                  prefix="₹"
                  showSavePercentage={true}
                  classNameSalePrice="text-2xl"
                />
              </>
            ) : (
              <PriceFormat_Sale
                originalPrice={product.price}
                prefix="₹"
                classNameSalePrice="text-2xl"
              />
            )}
          </div>
         
          <div className="mt-4">
            <ProductBuySection product={product} />
          </div>
          <div className="mt-4 bg-accent p-3 rounded-md">
            <h2 className="text-md font-semibold">Features</h2>
            <ul className="list-disc pl-4 text-muted-foreground">
              {product.features?.map((feat: any) => (
                <li key={feat}>{feat}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4 bg-accent p-3 rounded-md">
            <h2 className="text-md font-semibold">About this Product</h2>
            <p className="text-muted-foreground md:text-md text-sm">
              {product.description}
            </p>
          </div>
        </div>
        <div className="md:col-span-2">
          <h2 className="text-md font-semibold mt-4">Detailed Description</h2>
          <p className="text-muted-foreground md:text-md text-sm mb-4">
            {product.description}
          </p>
          <ProductReviewSection productId={id} />
        </div>
      </div>
    </div>
  );
};

export default ProductPage;