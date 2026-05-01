import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { useState, type FormEvent } from "react";

export type SortValue =
  | "rating"
  | "-rating"
  | "days"
  | "-days"
  | "co2kilograms"
  | "-co2kilograms"
  | "title"
  | "-title";

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "-rating", label: "Top rated" },
  { value: "rating", label: "Lowest rated" },
  { value: "days", label: "Shortest first" },
  { value: "-days", label: "Longest first" },
  { value: "co2kilograms", label: "Lowest emissions" },
  { value: "-co2kilograms", label: "Highest emissions" },
  { value: "title", label: "Title A→Z" },
  { value: "-title", label: "Title Z→A" },
];

const MIN_RATING_OPTIONS: { value: string; label: string }[] = [
  { value: "any", label: "Any rating" },
  { value: "3", label: "3.0+" },
  { value: "4", label: "4.0+" },
  { value: "4.5", label: "4.5+" },
];

export interface TripsFiltersValue {
  sort: SortValue;
  minRating: number | undefined;
  countries: string[];
}

interface TripsFiltersProps {
  value: TripsFiltersValue;
  onChange: (next: TripsFiltersValue) => void;
}

export default function TripsFilters({ value, onChange }: TripsFiltersProps) {
  const [countryDraft, setCountryDraft] = useState("");

  const addCountry = (e: FormEvent) => {
    e.preventDefault();
    const next = countryDraft.trim();
    if (!next) return;
    if (value.countries.some((c) => c.toLowerCase() === next.toLowerCase())) {
      setCountryDraft("");
      return;
    }
    onChange({ ...value, countries: [...value.countries, next] });
    setCountryDraft("");
  };

  const removeCountry = (country: string) => {
    onChange({
      ...value,
      countries: value.countries.filter((c) => c !== country),
    });
  };

  const minRatingValue =
    value.minRating === undefined ? "any" : String(value.minRating);

  const hasFilters =
    value.minRating !== undefined ||
    value.countries.length > 0 ||
    value.sort !== "-rating";

  return (
    <div className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
      <div className="grid gap-1.5">
        <Label htmlFor="sort">Sort</Label>
        <Select
          value={value.sort}
          onValueChange={(v) => onChange({ ...value, sort: v as SortValue })}
        >
          <SelectTrigger id="sort" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="min-rating">Min rating</Label>
        <Select
          value={minRatingValue}
          onValueChange={(v) =>
            onChange({
              ...value,
              minRating: v === "any" ? undefined : Number(v),
            })
          }
        >
          <SelectTrigger id="min-rating" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MIN_RATING_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="country">Countries</Label>
        <form onSubmit={addCountry} className="flex gap-2">
          <Input
            id="country"
            placeholder="Add country and press Enter…"
            value={countryDraft}
            onChange={(e) => setCountryDraft(e.target.value)}
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={!countryDraft.trim()}
          >
            Add
          </Button>
        </form>
        {value.countries.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {value.countries.map((country) => (
              <Badge
                key={country}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {country}
                <button
                  type="button"
                  aria-label={`Remove ${country}`}
                  onClick={() => removeCountry(country)}
                  className="rounded-sm opacity-60 hover:bg-muted-foreground/20 hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        disabled={!hasFilters}
        onClick={() =>
          onChange({ sort: "-rating", minRating: undefined, countries: [] })
        }
      >
        Reset
      </Button>
    </div>
  );
}
