import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import {
  flagUrl,
  startingPoints,
  type Destination,
} from "@/constants/destinations";

type DestinationCardProps = {
  destination: Destination;
};

export const DestinationCard = ({ destination }: DestinationCardProps) => (
  <Link
    href={`/products/${destination.slug}`}
    className="group flex items-center gap-4 rounded-md border border-line bg-surface-card p-4 shadow-fb-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-fb-md fb-focus"
  >
    <span className="relative h-9 w-12 shrink-0 overflow-hidden rounded-sm ring-1 ring-line">
      <Image
        src={flagUrl(destination.code, 160)}
        alt={`${destination.name} flag`}
        fill
        sizes="48px"
        className="object-cover"
      />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate font-heading text-lg font-medium text-ink">
        {destination.name}
      </span>
      <span className="font-mono text-xs text-ink-soft">
        Starts at {startingPoints(destination)} Points
      </span>
    </span>
    <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-soft transition-colors group-hover:text-green" />
  </Link>
);
