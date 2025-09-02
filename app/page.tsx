import AboutSection from "@/components/sections/about";
import CategorySection from "@/components/sections/category";
import Hero from "@/components/sections/hero";
import ProductsSection from "@/components/sections/products";
import { getHomeProducts } from "@/lib/queries/product";



export default async function Home() {
  const homeProducts = await getHomeProducts();

  return (
    <div className="grid gap-5">
      <Hero/>
      <CategorySection />
      <ProductsSection products={homeProducts} showViewAll={true} />
      <AboutSection />
    </div>
  );
}
