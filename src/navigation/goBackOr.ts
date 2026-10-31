import type { Href } from 'expo-router';

type RouterLike = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: Href) => void;
};

/** Pop the stack when possible; otherwise replace with a sensible parent route. */
export function goBackOr(router: RouterLike, fallback: Href) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
