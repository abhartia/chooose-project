import type { TripSummary } from "@/api/generated";
import TripCard from "./trip-card";

export default function TripsGrid({ trips }: { trips: TripSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}
