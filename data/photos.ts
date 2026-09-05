/** Shop photography under `public/photos/` — no Builder CDN.
 *  Extra shop shots kept in that folder for later use:
 *  `shop-choppers-2.jpg`, `shop-choppers-3.jpg`. */
export const shopPhotos = {
  hero: {
    src: "/photos/bagger-front.jpg",
    alt: "Custom Harley Road Glide outside Swafford Speed",
  },
  aboutHeader: {
    src: "/photos/bagger-side.jpg",
    alt: "Side profile of a custom orange and black Harley-Davidson CVO Road Glide at Swafford Speed",
  },
  aboutPrimary: {
    src: "/photos/shop-choppers-1.jpg",
    alt: "Custom Harleys in the Swafford Speed shop",
  },
} as const;
