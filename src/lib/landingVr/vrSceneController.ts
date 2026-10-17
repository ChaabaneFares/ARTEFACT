type VrSceneController = {
  setScrollRotationX: (rotationX: number) => void;
};

const controllers = new Map<string, VrSceneController>();

export function registerVrSceneController(
  sceneId: string,
  controller: VrSceneController,
): () => void {
  controllers.set(sceneId, controller);

  return () => {
    controllers.delete(sceneId);
  };
}

export function getVrSceneController(
  sceneId: string,
): VrSceneController | null {
  return controllers.get(sceneId) ?? null;
}
