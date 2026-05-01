import { listTripsInfiniteOptions } from "@/api/generated/@tanstack/react-query.gen";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TripsTable from "./TripsTable";
import TripsGrid from "./TripsGrid";
import { useEffect, useRef } from "react";

export function TripsList() {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    error,
  } = useInfiniteQuery({
    ...listTripsInfiniteOptions({ query: {} }),
    initialPageParam: { query: {} },
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.nextCursor : undefined,
  });

  useEffect(() => {
    const element = loadMoreRef.current;

    if (!element || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchNextPage();
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isPending) {
    return (
      <main className="container py-8">
        <h1 className="text-2xl font-semibold">Trips</h1>
        <p className="mt-4">Loading trips...</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="container py-8">
        <h1 className="text-2xl font-semibold">Trips</h1>
        <p className="mt-4 text-red-600">
          Failed to load trips: {error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="container py-8 flex flex-col items-center">
      <Tabs defaultValue="table" className="w-[80%] items-center">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Trips</h1>
          <TabsList>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="grid">Grid</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="table">
          <TripsTable trips={data?.pages.flatMap((page) => page.items) || []} />
        </TabsContent>
        <TabsContent value="grid">
          <TripsGrid trips={data?.pages.flatMap((page) => page.items) || []} />
        </TabsContent>
        <div
          ref={loadMoreRef}
          className="mt-6 py-4 text-center text-sm text-muted-foreground"
        >
          {isFetchingNextPage
            ? "Loading more..."
            : hasNextPage
              ? "Scroll for more trips"
              : "No more trips"}
        </div>
      </Tabs>
    </main>
  );
}
