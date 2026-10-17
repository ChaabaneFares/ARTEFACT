"use client";

import { useState } from "react";

export function useProjectVideo() {
  const [playing, setPlaying] = useState(false);
  const play = () => setPlaying(true);
  return { playing, play };
}
