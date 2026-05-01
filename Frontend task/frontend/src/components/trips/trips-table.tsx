import type { TripSummary } from "@/api/generated";
import StarRating from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEmissions } from "@/lib/format";
import { Leaf, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function TripsTable({ trips }: { trips: TripSummary[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="h-12 w-[88px] px-4" />
            <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Trip
            </TableHead>
            <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Countries
            </TableHead>
            <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Duration
            </TableHead>
            <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Emissions offset
            </TableHead>
            <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rating
            </TableHead>
            <TableHead className="h-12 px-4 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => {
            const dayLabel = trip.days === 1 ? "day" : "days";
            return (
              <TableRow
                key={trip.id}
                className="transition-colors hover:bg-muted/40"
              >
                <TableCell className="w-[88px] px-4 py-3">
                  <img
                    src={trip.photoUrl}
                    alt={trip.title}
                    className="h-14 w-14 min-w-14 rounded-lg object-cover ring-1 ring-border"
                  />
                </TableCell>
                <TableCell className="min-w-[180px] px-4 py-3">
                  <div className="font-semibold text-foreground">
                    {trip.title}
                  </div>
                  <div className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {trip.subtitle}
                  </div>
                </TableCell>
                <TableCell className="min-w-[180px] px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {trip.countries.map((country) => (
                      <span
                        key={country}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
                      >
                        <MapPin className="h-3 w-3" />
                        {country}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap px-4 py-3">
                  <div className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {trip.days} {dayLabel}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap px-4 py-3">
                  <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <Leaf className="h-3.5 w-3.5" />
                    {formatEmissions(trip.co2kilograms)}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap px-4 py-3 text-sm">
                  <StarRating rating={trip.rating} />
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/trips/${trip.id}`}>Learn more</Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
