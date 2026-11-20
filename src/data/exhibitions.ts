
export interface ExhibitionImage {
  src: string;
  srcset?: string;
  full: string;
  alt: string;

  // Resolved public attribution
  credit: string;
  creditName?: string;
  creditUrl?: string;
}

export interface Exhibition {
  slug: string;
  maker: string;
  makerSlug?: string;
  name: string;
  reference: string;
  publishedAt: string;
  images: ExhibitionImage[];
}

export interface Maker {
  slug: string;
  name: string;
}

export interface Attribution {
  name: string;
  url: string;
}

export interface CMSExhibition {
  slug: string;
  name: string;
  maker: string;
  reference?: string;
  publishedAt: string;
  status: 'draft' | 'published';
  rightsStatus: 'pending' | 'approved' | 'restricted';
  attribution: Attribution;
  images: Array<{
    src: string;
    alt: string;
    attribution?: Attribution | null;
  }>;
  sourceNotes?: string;
}

