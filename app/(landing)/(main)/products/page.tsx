import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/fastbird";
import { ProductsCatalog } from "@/components/landing/products-catalog";

export const metadata: Metadata = {
  title: "eSIM destinations",
  description:
    "Browse instant eSIM data plans for 100+ destinations. Find your country, pick a plan, and pay with Points.",
};

const ProductsPage = () => (
  <>
    <section className="border-b border-line bg-sand">
      <Container className="py-16 lg:py-20">
        <Eyebrow>// SHOP eSIM</Eyebrow>
        <h1 className="mt-4 max-w-2xl font-heading text-h1 font-medium text-ink">
          Find data for wherever you&apos;re headed.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
          Search by country or region, choose the plan that fits, and connect the
          moment you land. Prices shown in Points.
        </p>
      </Container>
    </section>

    <section className="bg-surface py-12 lg:py-16">
      <Container>
        <ProductsCatalog />
      </Container>
    </section>
  </>
);

export default ProductsPage;
