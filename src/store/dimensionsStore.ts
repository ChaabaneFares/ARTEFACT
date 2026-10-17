import type { Store } from "storio";
import { create } from "storio";

export type DimensionsState = {
  vw: number;
  setVw: (width: number) => void;
  isMobile: () => boolean;
  isTablet: () => boolean;
  isDesktop: () => boolean;
};

export const dimensionsStore: Store<DimensionsState> = create<DimensionsState>(
  (set) => ({
    vw: 0,
    setVw: (width: number) => set({ vw: width }),
    isMobile: () => {
      const { vw } = dimensionsStore.getState();
      return vw <= 600;
    },
    isTablet: () => {
      const { vw } = dimensionsStore.getState();
      return vw > 600 && vw <= 1024;
    },
    isDesktop: () => {
      const { vw } = dimensionsStore.getState();
      return vw >= 1024;
    },
  }),
);
