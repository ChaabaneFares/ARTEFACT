export const LANDING_PROCESS_SECTION_ID = "landing-process";

export const PROCESS_CARD_SELECTOR = "[data-process-card]";
export const PROCESS_CARD_CONTENT_SELECTOR = "[data-process-card-content]";
export const PROCESS_ILLUSTRATION_SELECTOR = "[data-process-illustration]";
export const PROCESS_SCENE_MOUNT_SELECTOR = "[data-process-scene-mount]";

export function getProcessRootSelector(sectionId: string): string {
  return `[data-process-id="${sectionId}"]`;
}
