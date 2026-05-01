import { getTripByIdOptions } from "@/api/generated/@tanstack/react-query.gen";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Calendar, Clock, Globe, Star, Wallet, FlagIcon, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export function TripDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: trip } = useQuery(getTripByIdOptions({ path: { id: Number(id) } }));

  const randomLucideIcons = [<FlagIcon />, <Globe />, <Briefcase />, <Users />, <Calendar />, <Clock />, <Wallet />, <Star />];

  return (
    <main className="container py-8">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary underline hover:cursor-pointer">Go Back</Link>
      <h1 className="mt-10 text-2xl font-semibold">{trip?.title}</h1>
      <p className="text-muted-foreground mt-2">
        {trip?.subtitle}
      </p>
      <div className="grid grid-cols-1 gap-8 mt-4 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        {/*Left column*/}
        <div className="min-w-0">
          <img src={trip?.photoUrl} alt={trip?.title} className="w-full aspect-video object-cover rounded-lg" />
          <section className="mt-6 grid gap-3">
            <h2 className="text-xl font-semibold">Overview</h2>
            <div className="grid gap-3 grid-cols-2">
              {trip?.advantages?.map((advantage, index) => (
                <div key={advantage.title} className="flex gap-2">
                  <div className="m-1">{randomLucideIcons[index]}</div>
                  <div>
                    <h3 className="font-semibold">{advantage.title}</h3>
                    <p className="text-sm text-muted-foreground">{advantage.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <Separator className="my-4" />
          <p>{trip?.description}</p>
        </div>
        {/*Summary Card*/}
        <div className="min-w-0">
          <div className="bg-card p-4 rounded-lg border">
            <h2 className="text-lg font-semibold">{trip?.days} days </h2>
            <p className="text-sm text-muted-foreground font-bold">Emissions: {trip?.co2kilograms.toFixed(1)} kg CO2e</p>
            <Separator className="my-4" />
            <div className="text-sm text-muted-foreground font-semibold">
              Countries included:
            </div>
            <ul className="mt-1 columns-2 list-disc list-inside gap-2 text-sm text-muted-foreground">
              {trip?.countries.map((country) => (
                <li key={country}>{country}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
