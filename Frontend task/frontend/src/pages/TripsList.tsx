import { listTripsInfiniteOptions } from "@/api/generated/@tanstack/react-query.gen";
import TripsFilters, {
  type SortValue,
  type TripsFiltersValue,
} from "@/components/trips/trips-filters";
import TripsGrid from "@/components/trips/trips-grid";
import TripsTable from "@/components/trips/trips-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";

const SORT_VALUES = [
  "rating",
  "-rating",
  "days",
  "-days",
  "co2kilograms",
  "-co2kilograms",
  "title",
  "-title",
] as const satisfies readonly SortValue[];

const VIEW_VALUES = ["table", "grid"] as const;
type ViewValue = (typeof VIEW_VALUES)[number];

function parseSort(raw: string | null): SortValue {
  return (SORT_VALUES as readonly string[]).includes(raw ?? "")
    ? (raw as SortValue)
    : "-rating";
}

function parseView(raw: string | null): ViewValue {
  return (VIEW_VALUES as readonly string[]).includes(raw ?? "")
    ? (raw as ViewValue)
    : "table";
}

function parseMinRating(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 5 ? n : undefined;
}

export function TripsList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: TripsFiltersValue = useMemo(
    () => ({
      sort: parseSort(searchParams.get("sort")),
      minRating: parseMinRating(searchParams.get("minRating")),
      countries: searchParams.getAll("country"),
    }),
    [searchParams],
  );
  const view = parseView(searchParams.get("view"));

  const setFilters = (next: TripsFiltersValue) => {
    const sp = new URLSearchParams(searchParams);
    if (next.sort === "-rating") sp.delete("sort");
    else sp.set("sort", next.sort);
    if (next.minRating === undefined) sp.delete("minRating");
    else sp.set("minRating", String(next.minRating));
    sp.delete("country");
    next.countries.forEach((c) => sp.append("country", c));
    setSearchParams(sp, { replace: true });
  };

  const setView = (next: ViewValue) => {
    const sp = new URLSearchParams(searchParams);
    if (next === "table") sp.delete("view");
    else sp.set("view", next);
    setSearchParams(sp, { replace: true });
  };

  const queryParams = useMemo(
    () => ({
      sort: filters.sort,
      minRating: filters.minRating,
      country:
        filters.countries.length > 0 ? filters.countries : undefined,
    }),
    [filters],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    error,
  } = useInfiniteQuery({
    ...listTripsInfiniteOptions({ query: queryParams }),
    // Hey-API's infinite queryFn unwraps either a string (used as `cursor`) or
    // an object pageParam. Pass an empty object to mean "no cursor on the
    // first request"; subsequent pages return the cursor string.
    initialPageParam: { query: {} },
    getNextPageParam: (last) => last.pageInfo.nextCursor ?? undefined,
  });

  const trips = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // Infinite scroll: observe a sentinel and fetch the next page when it enters
  // the viewport (200px ahead of the visible edge for smoother continuity).
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <main className="container py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Trips</h1>
            <p className="text-sm text-muted-foreground">
              {isPending
                ? "Loading…"
                : `Showing ${trips.length} of ${totalCount} ${totalCount === 1 ? "trip" : "trips"}`}
            </p>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as ViewValue)}>
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="grid">Grid</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <TripsFilters value={filters} onChange={setFilters} />

        {isError ? (
          <p className="text-sm text-destructive">
            Failed to load trips: {error?.message ?? "unknown error"}
          </p>
        ) : isPending ? (
          <p className="text-sm text-muted-foreground">Loading trips…</p>
        ) : trips.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No trips match these filters.
          </p>
        ) : view === "table" ? (
          <TripsTable trips={trips} />
        ) : (
          <TripsGrid trips={trips} />
        )}

        <div
          ref={loadMoreRef}
          className="py-4 text-center text-sm text-muted-foreground"
        >
          {isFetchingNextPage
            ? "Loading more…"
            : hasNextPage
              ? "Scroll for more trips"
              : trips.length > 0
                ? "No more trips"
                : null}
        </div>
      </div>
    </main>
  );
}
