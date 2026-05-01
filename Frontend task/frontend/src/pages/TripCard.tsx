import { TripSummary } from "@/api/generated";
import StarRating from "@/components/ui/StarRating";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

function formatEmissions(kg: number) {
  if (kg >= 1000) {
    return (
      <>
        {(kg / 1000).toFixed(1)} t CO<sub>2</sub>e
      </>
    );
  }
  return (
    <>
      {Math.round(kg)} kg CO<sub>2</sub>e
    </>
  );
}

export default function TripCard({ trip }: { trip: TripSummary }) {
  const countryLabel = trip.countries.length === 1 ? "Country" : "Countries";
  const dayLabel = trip.days === 1 ? "day" : "days";

  return (
    <Card className="relative aspect-[6/5] overflow-hidden rounded-lg border-[10px] border-white shadow-2xl">
      <img
        src={trip.photoUrl}
        alt={trip.title}
        className="absolute inset-0 h-full w-full object-cover rounded-lg"
      />

      <div className="relative z-10 flex h-full flex-col p-3">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h3 className="text-md leading-tight text-white/80 mt-2">{trip.title}</h3>
          <p className="mt-2 text-xs text-white/90">
            {trip.countries.length} {countryLabel}, {trip.days} {dayLabel}
          </p>
          <Button
            asChild
            className="my-3 h-8 rounded-md bg-blue-500 p-3 text-xs text-white/60 font-semibold hover:bg-blue-600"
          >
            <Link to={`/trips/${trip.id}`}>Learn more</Link>
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2.5 text-xs text-white/60">
          <span>Emissions offset:</span>
          <span className="font-semibold">{formatEmissions(trip.co2kilograms)}</span>
        </div>

        <div className="-mx-3 -mb-3 mt-2 flex items-center justify-between gap-2 whitespace-nowrap rounded-t-lg bg-white px-4 py-2.5 text-xs">
          <span className="font-semibold">Trip rating</span>
          <StarRating rating={trip.rating} />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/55" />
    </Card>
  );
}
