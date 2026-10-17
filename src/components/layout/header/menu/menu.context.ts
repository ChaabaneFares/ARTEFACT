"use client";

import { createContext, useContext } from "react";
import type { useMenuLogic } from "./menu.client.logic";

export const MenuContext = createContext<ReturnType<
  typeof useMenuLogic
> | null>(null);
export function useMenuState() {
  const state = useContext(MenuContext);
  if (!state) throw new Error("Menu controls require a menu");
  return state;
}
