type ProcessSceneController = {
  setScrollRotationX: (rotationX: number) => void;
};

const controllers = new Map<string, ProcessSceneController>();

export function registerProcessSceneController(
  sceneId: string,
  controller: ProcessSceneController,
): () => void {
  controllers.set(sceneId, controller);

  return () => {
    controllers.delete(sceneId);
  };
}

export function getProcessSceneController(
  sceneId: string,
): ProcessSceneController | null {
  return controllers.get(sceneId) ?? null;
}
