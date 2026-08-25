/**
 * CSS custom properties in a `style` prop. React's own `CSSProperties` has no
 * index signature, so without this every `--var` needs an `as` cast at the call
 * site — one augmentation is cheaper than a cast per component.
 */
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

export {};
