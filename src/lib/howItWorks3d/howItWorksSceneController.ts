type HowItWorksSceneController = {
  setScrollRotationX: (rotationX: number) => void;
};

const controllers = new Map<string, HowItWorksSceneController>();

export function registerHowItWorksSceneController(
  sceneId: string,
  controller: HowItWorksSceneController,
): () => void {
  controllers.set(sceneId, controller);

  return () => {
    controllers.delete(sceneId);
  };
}

export function getHowItWorksSceneController(
  sceneId: string,
): HowItWorksSceneController | null {
  return controllers.get(sceneId) ?? null;
}
