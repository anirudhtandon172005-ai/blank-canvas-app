import { useState, useEffect, useCallback } from "react";

type Breakpoint = "mobile" | "tablet" | "desktop";

interface ResponsivePageSizeConfig {
  mobile: number;   // <768px: 2 cols = 2 per row
  tablet: number;   // 768px-1023px: 2 cols = 4 (2 rows)
  desktop: number;  // >=1024px: 3 cols = 6 (2 rows)
}

const DEFAULT_CONFIG: ResponsivePageSizeConfig = {
  mobile: 2,
  tablet: 4,
  desktop: 6,
};

function getBreakpoint(width: number): Breakpoint {
  if (width >= 1024) return "desktop";
  if (width >= 768) return "tablet";
  return "mobile";
}

function getPageSize(breakpoint: Breakpoint, config: ResponsivePageSizeConfig): number {
  return config[breakpoint];
}

export function useResponsivePageSize(config: ResponsivePageSizeConfig = DEFAULT_CONFIG) {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    if (typeof window === "undefined") return "desktop";
    return getBreakpoint(window.innerWidth);
  });

  const [pageSize, setPageSize] = useState(() => getPageSize(breakpoint, config));

  const updateBreakpoint = useCallback(() => {
    const newBreakpoint = getBreakpoint(window.innerWidth);
    if (newBreakpoint !== breakpoint) {
      setBreakpoint(newBreakpoint);
      setPageSize(getPageSize(newBreakpoint, config));
    }
  }, [breakpoint, config]);

  useEffect(() => {
    // Initial check
    updateBreakpoint();

    // Use matchMedia for efficient breakpoint detection
    const mediaQueryDesktop = window.matchMedia("(min-width: 1024px)");
    const mediaQueryTablet = window.matchMedia("(min-width: 768px)");

    const handleChange = () => {
      updateBreakpoint();
    };

    // Modern browsers
    if (mediaQueryDesktop.addEventListener) {
      mediaQueryDesktop.addEventListener("change", handleChange);
      mediaQueryTablet.addEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQueryDesktop.addListener(handleChange);
      mediaQueryTablet.addListener(handleChange);
    }

    return () => {
      if (mediaQueryDesktop.removeEventListener) {
        mediaQueryDesktop.removeEventListener("change", handleChange);
        mediaQueryTablet.removeEventListener("change", handleChange);
      } else {
        mediaQueryDesktop.removeListener(handleChange);
        mediaQueryTablet.removeListener(handleChange);
      }
    };
  }, [updateBreakpoint]);

  return { pageSize, breakpoint };
}
