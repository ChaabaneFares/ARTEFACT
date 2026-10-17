"use client";

import { useInViewOnce } from "@/lib/useInViewOnce";

export function useProjectTour() {
  return useInViewOnce({ rootMargin: "200px 0px" });
}
