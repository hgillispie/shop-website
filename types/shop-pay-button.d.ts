// Ambient JSX typing for Shopify's "Buy with Shop Pay" custom element
// (<shop-pay-button>, loaded via a <script type="module"> in
// app/store/layout.tsx). See components/store/ShopPayButton.tsx for why
// this specific web component was chosen and how it's used.
//
// Augmenting "react"'s own JSX namespace (not a bare `declare global {
// namespace JSX }`) — with the "react-jsx" automatic runtime + TS's
// per-package JSX namespace resolution, IntrinsicElements is resolved via
// react/jsx-runtime re-exporting React's own JSX namespace, confirmed by
// reading node_modules/@types/react/jsx-runtime.d.ts directly rather than
// assuming the older global-namespace convention still applies.
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type ShopPayButtonElement = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  "store-url": string;
  variants: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "shop-pay-button": ShopPayButtonElement;
    }
  }
}
