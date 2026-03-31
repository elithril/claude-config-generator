export type TransitionDirection = "hero-to-app" | "app-to-hero" | "app-to-app";

export function setTransitionDirection(direction: TransitionDirection) {
  document.documentElement.dataset.vtDirection = direction;
}
