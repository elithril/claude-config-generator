export type TransitionDirection = "hero-to-app" | "app-to-hero" | "app-to-app";

export function setTransitionDirection(direction: TransitionDirection) {
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const value = isMobile ? `mobile-${direction}` : direction;

  document.documentElement.dataset.vtDirection = value;
  setTimeout(() => {
    if (document.documentElement.dataset.vtDirection === value) {
      delete document.documentElement.dataset.vtDirection;
    }
  }, 1800);
}
