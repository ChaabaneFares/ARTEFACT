"use client";

import type { PointerEvent, ReactNode, RefObject } from "react";
import { useEffect, useRef } from "react";
import { createRAFBatch } from "@/lib/scrollInteraction/scrollTrigger";
import styles from "./echoView.module.css";

const ROTATE_X_LIMIT = 6;
const ROTATE_Y_LIMIT = 10;
const SHIFT_LIMIT = 18;

function setStageMotion(
  element: HTMLDivElement,
  pointerX: number,
  pointerY: number,
) {
  element.style.setProperty(
    "--echo-rotate-x",
    `${(-pointerY * ROTATE_X_LIMIT).toFixed(2)}deg`,
  );
  element.style.setProperty(
    "--echo-rotate-y",
    `${(pointerX * ROTATE_Y_LIMIT).toFixed(2)}deg`,
  );
  element.style.setProperty(
    "--echo-shift-x",
    `${(pointerX * SHIFT_LIMIT).toFixed(2)}px`,
  );
  element.style.setProperty(
    "--echo-shift-y",
    `${(pointerY * SHIFT_LIMIT).toFixed(2)}px`,
  );
}

type EchoViewMotionProps = {
  children: ReactNode;
  motionId: string;
};

function scheduleStageMotion(
  stageRef: RefObject<HTMLDivElement | null>,
  rafBatchRef: RefObject<ReturnType<typeof createRAFBatch>>,
  motionId: string,
  pointerX: number,
  pointerY: number,
) {
  const stage = stageRef.current;

  if (!stage) {
    return;
  }

  rafBatchRef.current.schedule(`echo-view-stage-motion-${motionId}`, () => {
    setStageMotion(stage, pointerX, pointerY);
  });
}

export default function EchoViewMotion({
  children,
  motionId,
}: EchoViewMotionProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rafBatchRef = useRef(createRAFBatch());

  useEffect(() => {
    scheduleStageMotion(stageRef, rafBatchRef, motionId, 0, 0);

    return () => {
      rafBatchRef.current.cancelAll();
    };
  }, [motionId]);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      return;
    }

    const { currentTarget, clientX, clientY } = event;
    const bounds = currentTarget.getBoundingClientRect();
    const pointerX = (clientX - bounds.left) / bounds.width - 0.5;
    const pointerY = (clientY - bounds.top) / bounds.height - 0.5;

    scheduleStageMotion(stageRef, rafBatchRef, motionId, pointerX, pointerY);
  };

  const handlePointerLeave = () => {
    scheduleStageMotion(stageRef, rafBatchRef, motionId, 0, 0);
  };

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      data-echo-view-stage
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </div>
  );
}
