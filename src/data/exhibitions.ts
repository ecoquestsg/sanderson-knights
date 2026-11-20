
export interface ExhibitionImage {
  src: string;
  srcset?: string;
  full: string;
  alt: string;
  credit: string;
}

export interface Exhibition {
  slug: string;
  maker: string;
  name: string;
  reference: string;
  publishedAt: string;
  images: ExhibitionImage[];
}
