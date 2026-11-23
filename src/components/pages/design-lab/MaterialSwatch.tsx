import { useId } from "react";
import type { Material } from "@/lib/mock";

/** Flat SVG pattern swatch for a material (no raster images). */
export function MaterialSwatch({ material, className }: { material: Material; className?: string }) {
  const id = useId();
  const pid = `pat-${id}`;
  const c = material.swatch;

  const pattern = (() => {
    switch (material.pattern) {
      case "brick":
        return (
          <pattern id={pid} width="24" height="12" patternUnits="userSpaceOnUse">
            <rect width="24" height="12" fill={c} />
            <rect x="0" y="0" width="11" height="5" fill="#c7634a" />
            <rect x="12" y="0" width="12" height="5" fill="#ad5038" />
            <rect x="-6" y="6" width="11" height="5" fill="#ad5038" />
            <rect x="6" y="6" width="11" height="5" fill="#c7634a" />
            <rect x="18" y="6" width="11" height="5" fill="#ad5038" />
            <path d="M0 5.5h24M0 11.5h24M11.5 0v5M5.5 6v6M17.5 6v6" stroke="#e8d6cf" strokeWidth="1" />
          </pattern>
        );
      case "concrete":
        return (
          <pattern id={pid} width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill={c} />
            <circle cx="4" cy="5" r="0.9" fill="#9aa1ac" />
            <circle cx="14" cy="3" r="0.7" fill="#cdd2da" />
            <circle cx="9" cy="12" r="1" fill="#9aa1ac" />
            <circle cx="17" cy="15" r="0.8" fill="#cdd2da" />
            <circle cx="3" cy="17" r="0.6" fill="#9aa1ac" />
            <path d="M0 10h20" stroke="#a7adb7" strokeWidth="0.6" />
          </pattern>
        );
      case "wood":
        return (
          <pattern id={pid} width="10" height="40" patternUnits="userSpaceOnUse">
            <rect width="10" height="40" fill="#d99a57" />
            <rect x="0" width="7" height="40" fill={c} />
            <rect x="7" width="3" height="40" fill="#9c6a35" />
            <path d="M2 0v40M4.5 0v40" stroke="#b37a3f" strokeWidth="0.5" />
          </pattern>
        );
      case "stone":
        return (
          <pattern id={pid} width="30" height="20" patternUnits="userSpaceOnUse">
            <rect width="30" height="20" fill={c} />
            <rect x="1" y="1" width="13" height="8" fill="#b8b2a8" />
            <rect x="16" y="1" width="13" height="8" fill="#9f998f" />
            <rect x="-6" y="11" width="13" height="8" fill="#9f998f" />
            <rect x="9" y="11" width="13" height="8" fill="#b8b2a8" />
            <rect x="24" y="11" width="13" height="8" fill="#9f998f" />
          </pattern>
        );
      case "glass":
        return (
          <pattern id={pid} width="24" height="24" patternUnits="userSpaceOnUse">
            <rect width="24" height="24" fill={c} />
            <path d="M0 24L24 0" stroke="#d9e8f8" strokeWidth="5" />
            <path d="M-6 18L12 0" stroke="#86b0dc" strokeWidth="1" />
            <path d="M0 12h24M12 0v24" stroke="#6f9bca" strokeWidth="0.8" />
          </pattern>
        );
      case "greenery":
      default:
        return (
          <pattern id={pid} width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill={c} />
            <circle cx="4" cy="4" r="2.6" fill="#4b8a3c" />
            <circle cx="12" cy="7" r="2.2" fill="#7bb562" />
            <circle cx="6" cy="12" r="2.4" fill="#3f7a33" />
            <circle cx="13" cy="14" r="1.8" fill="#8fc474" />
          </pattern>
        );
    }
  })();

  return (
    <svg viewBox="0 0 80 60" className={className} aria-hidden preserveAspectRatio="none">
      <defs>{pattern}</defs>
      <rect width="80" height="60" fill={`url(#${pid})`} />
    </svg>
  );
}
