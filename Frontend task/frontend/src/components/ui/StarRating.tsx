import { Star } from "lucide-react";

export default function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={
              index < Math.round(rating)
                ? "size-4 fill-yellow-400 text-yellow-400"
                : "size-4 fill-none text-gray-300"
            }
          />
        ))}
      </div>
      <span className="font-semibold">{rating.toFixed(1)}</span>
    </div>
  );
}
