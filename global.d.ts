import type { ThreeElements } from '@react-three/fiber';

declare global {
  namespace React {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      interface IntrinsicElements extends ThreeElements {}
    }
  }

  // Legacy global JSX namespace — kept for backwards compat with libs
  // still shipping type augmentations against the old name.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends ThreeElements {}
  }
}
