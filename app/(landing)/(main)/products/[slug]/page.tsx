import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/fastbird";
import { DestinationDetail } from "@/components/landing/destination-detail";
import {
  destinations,
  getDestination,
  flagUrl,
  startingPoints,
} from "@/constants/destinations";

type Params = { params: { slug: string } };

export const generateStaticParams = () =>
  destinations.map((d) => ({ slug: d.slug }));

export const generateMetadata = ({ params }: Params): Metadata => {
  const dest = getDestination(params.slug);
  if (!dest) return { title: "Destination not found" };
  return {
    title: `${dest.name} eSIM`,
    description: `Instant eSIM data plans for ${dest.name}. From ${startingPoints(
      dest
    )} Points — get your QR and connect in minutes.`,
  };
};

const DestinationPage = ({ params }: Params) => {
  const destination = getDestination(params.slug);
  if (!destination) notFound();

  const nearby = destinations
    .filter((d) => d.region === destination.region && d.slug !== destination.slug)
    .slice(0, 4);

  return (
    <>
      <section className="border-b border-line bg-sand">
        <Container className="py-12 lg:py-16">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.06em] text-ink-soft">
              <li>
                <Link href="/products" className="hover:text-ink fb-focus">
                  eSIM
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-ink">{destination.name}</li>
            </ol>
          </nav>

          <div className="mt-6 flex items-center gap-5">
            <span className="relative h-14 w-20 overflow-hidden rounded-md ring-1 ring-line">
              <Image
                src={flagUrl(destination.code, 320)}
                alt={`${destination.name} flag`}
                fill
                sizes="80px"
                className="object-cover"
                priority
              />
            </span>
            <div>
              <h1 className="font-heading text-h1 font-medium text-ink">
                {destination.name}
              </h1>
              <p className="mt-1 font-mono text-sm text-ink-soft">
                Travel data from {startingPoints(destination)} Points
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-surface py-12 lg:py-16">
        <Container>
          <DestinationDetail destination={destination} nearby={nearby} />
        </Container>
      </section>
    </>
  );
};

export default DestinationPage;
