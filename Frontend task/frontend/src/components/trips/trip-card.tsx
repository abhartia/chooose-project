import type { TripSummary } from "@/api/generated";
import StarRating from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatEmissions } from "@/lib/format";
import { Link } from "react-router-dom";

export default function TripCard({ trip }: { trip: TripSummary }) {
  const countryLabel = trip.countries.length === 1 ? "Country" : "Countries";
  const dayLabel = trip.days === 1 ? "day" : "days";

  return (
    <Card className="relative aspect-[7/6] overflow-hidden rounded-2xl border-[clamp(8px,3cqi,14px)] border-white shadow-2xl [container-type:inline-size]">
      <img
        src={trip.photoUrl}
        alt={trip.title}
        className="absolute inset-0 h-full w-full rounded-lg object-cover"
      />

      <div className="relative z-10 flex h-full flex-col p-[clamp(8px,3cqi,16px)]">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h3 className="mt-[clamp(4px,2cqi,8px)] text-[clamp(14px,5cqi,22px)] font-semibold leading-tight text-white">
            {trip.title}
          </h3>
          <p className="mt-[clamp(2px,1cqi,4px)] text-[clamp(10px,3cqi,13px)] text-white/90">
            {trip.countries.length} {countryLabel}, {trip.days} {dayLabel}
          </p>
          <Button
            asChild
            className="my-[clamp(8px,3cqi,14px)] h-[clamp(22px,7cqi,32px)] rounded-md bg-blue-500 px-[clamp(8px,3cqi,14px)] text-[clamp(10px,3cqi,13px)] font-semibold text-white hover:bg-blue-600"
          >
            <Link to={`/trips/${trip.id}`}>Learn more</Link>
          </Button>
        </div>

        <div className="mx-auto flex w-full max-w-[clamp(220px,70cqi,360px)] items-center justify-between gap-[clamp(6px,2cqi,10px)] whitespace-nowrap rounded-lg bg-slate-900 px-[clamp(8px,3cqi,14px)] py-[clamp(6px,2.5cqi,10px)] text-[clamp(10px,3cqi,13px)] text-white/90">
          <span>Emissions offset:</span>
          <span className="font-semibold">
            {formatEmissions(trip.co2kilograms)}
          </span>
        </div>

        <div className="mx-auto -mb-[clamp(8px,3cqi,16px)] mt-[clamp(6px,2cqi,10px)] flex w-fit items-center gap-[clamp(20px,7cqi,32px)] whitespace-nowrap rounded-t-lg bg-white px-[clamp(10px,4cqi,18px)] py-[clamp(6px,2cqi,10px)] text-[clamp(10px,3cqi,13px)]">
          <span className="font-semibold">Trip rating</span>
          <StarRating rating={trip.rating} />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/55" />
    </Card>
  );
}
