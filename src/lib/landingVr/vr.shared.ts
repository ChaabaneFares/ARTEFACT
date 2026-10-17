export const LANDING_VR_SCENE_ID = "landing-vr";

export const VR_SCENE_MOUNT_SELECTOR = "[data-vr-scene-mount]";

export function getVrRootSelector(sceneId: string): string {
  return `[data-vr-id="${sceneId}"]`;
}
