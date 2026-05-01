import type { ReactNode } from "react";

/**
 * Render emissions as "kg CO₂e" or "t CO₂e", with the chemical formula
 * in a `<sub>` tag. Returns JSX so it can be embedded directly.
 */
export function formatEmissions(kg: number): ReactNode {
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
