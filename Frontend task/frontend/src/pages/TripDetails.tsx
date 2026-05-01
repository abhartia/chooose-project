import { getTripByIdOptions } from "@/api/generated/@tanstack/react-query.gen";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Calendar,
  Clock,
  Globe,
  Star,
  Wallet,
  FlagIcon,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const ADVANTAGE_ICONS: readonly LucideIcon[] = [
  FlagIcon,
  Globe,
  Briefcase,
  Users,
  Calendar,
  Clock,
  Wallet,
  Star,
];

export function TripDetails() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = Number(idParam);
  const isValidId = Number.isInteger(id) && id > 0;

  const { data: trip, isPending, isError, error } = useQuery({
    ...getTripByIdOptions({ path: { id } }),
    enabled: isValidId,
  });

  if (!isValidId) {
    return (
      <PageShell>
        <h1 className="text-2xl font-semibold">Invalid trip</h1>
        <p className="mt-2 text-muted-foreground">
          The URL doesn't contain a valid trip id.
        </p>
      </PageShell>
    );
  }

  if (isPending) {
    return (
      <PageShell>
        <p className="text-muted-foreground">Loading trip…</p>
      </PageShell>
    );
  }

  if (isError) {
    const status = (error as { status?: number } | undefined)?.status;
    return (
      <PageShell>
        <h1 className="text-2xl font-semibold">
          {status === 404 ? "Trip not found" : "Couldn't load trip"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {status === 404
            ? `No trip with id ${id} exists.`
            : (error?.message ?? "Unknown error.")}
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <h1 className="mt-10 text-2xl font-semibold">{trip.title}</h1>
      <p className="mt-2 text-muted-foreground">{trip.subtitle}</p>
      <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        {/* Left column */}
        <div className="min-w-0">
          <img
            src={trip.photoUrl}
            alt={trip.title}
            className="aspect-video w-full rounded-lg object-cover"
          />
          <section className="mt-6 grid gap-3">
            <h2 className="text-xl font-semibold">Overview</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {trip.advantages.map((advantage, index) => {
                const Icon =
                  ADVANTAGE_ICONS[index % ADVANTAGE_ICONS.length];
                return (
                  <div key={advantage.title} className="flex gap-2">
                    <Icon className="m-1 size-5 shrink-0 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{advantage.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {advantage.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <Separator className="my-4" />
          <p>{trip.description}</p>
        </div>
        {/* Summary card */}
        <div className="min-w-0">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-lg font-semibold">{trip.days} days</h2>
            <p className="text-sm font-bold text-muted-foreground">
              Emissions: {trip.co2kilograms.toFixed(1)} kg CO<sub>2</sub>e
            </p>
            <Separator className="my-4" />
            <div className="text-sm font-semibold text-muted-foreground">
              Countries included:
            </div>
            <ul className="mt-1 columns-2 list-inside list-disc gap-2 text-sm text-muted-foreground">
              {trip.countries.map((country) => (
                <li key={country}>{country}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="container py-8">
      <Link
        to="/"
        className="text-sm text-muted-foreground underline hover:cursor-pointer hover:text-primary"
      >
        Go Back
      </Link>
      <div className="mt-2">{children}</div>
    </main>
  );
}
