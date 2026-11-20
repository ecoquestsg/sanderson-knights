
import type {
  Attribution,
  CMSExhibition,
  Exhibition,
  Maker,
} from './exhibitions';

// ======================================================
// 01 — LOAD MAKERS
// ======================================================

// Read all maker records created by Pages CMS.
const makerFiles = import.meta.glob<Maker>(
  '../content/makers/*.json',
  { eager: true, import: 'default' }
);

export const makers: Maker[] = Object.values(
  makerFiles
).sort((a, b) => a.name.localeCompare(b.name));

// Map permanent maker slugs to their display names.
const makerMap = new Map(
  makers.map((maker) => [maker.slug, maker.name])
);

// ======================================================
// 02 — LOAD EXHIBITIONS
// ======================================================

// Read all exhibition records created by Pages CMS.
const exhibitionFiles = import.meta.glob<CMSExhibition>(
  '../content/exhibitions/*.json',
  { eager: true, import: 'default' }
);

// Resolve exhibition slugs from existing data or filename.
// This supports both legacy and newly created records.
const allExhibitions = Object.entries(exhibitionFiles)
  .map(([path, post]) => ({
    ...post,
    slug:
      post.slug ||
      path.split('/').pop()!.replace(/\.json$/, ''),
  }));

// ======================================================
// 03 — RESOLVE IMAGE ATTRIBUTION
// ======================================================

function resolveAttribution(
  imageCredit: Attribution | null | undefined,
  defaultCredit: Attribution
): Attribution {
  // No override: use the exhibition-level attribution.
  if (
    !imageCredit ||
    (!imageCredit.name && !imageCredit.url)
  ) {
    return defaultCredit;
  }

  // An override must include BOTH the credit name
  // and original source URL.
  if (!imageCredit.name || !imageCredit.url) {
    throw new Error(
      'Image attribution override requires name and URL.'
    );
  }

  return imageCredit;
}

// ======================================================
// 04 — VALIDATE & PREPARE PUBLISHED EXHIBITIONS
// ======================================================

export const publishedExhibitions: Exhibition[] =
  allExhibitions
    .filter(
      (post) =>
        post.status === 'published' &&
        post.rightsStatus === 'approved'
    )
    .map((post) => {
      const makerName = makerMap.get(post.maker);

      if (!makerName) {
        throw new Error(
          `Unknown maker "${post.maker}" in ${post.slug}`
        );
      }

      if (
        !post.attribution?.name ||
        !post.attribution?.url
      ) {
        throw new Error(
          `Missing default attribution in ${post.slug}`
        );
      }

      if (
        !/^https?:\/\/.+/i.test(post.attribution.url)
      ) {
        throw new Error(
          `Invalid attribution URL in ${post.slug}`
        );
      }

      if (
        !Array.isArray(post.images) ||
        post.images.length < 3 ||
        post.images.length > 8
      ) {
        throw new Error(
          `${post.slug} requires 3–8 photographs.`
        );
      }

      const images = post.images.map((image, index) => {
        const credit = resolveAttribution(
          image.attribution,
          post.attribution
        );

        if (
          !image.src ||
          !/^https?:\/\/.+/i.test(credit.url)
        ) {
          throw new Error(
            `Invalid image data in ${post.slug}`
          );
        }

        return {
          src: image.src,
          full: image.src,

          // Use manually entered alt text when provided.
          // Otherwise generate a basic fallback.
          alt:
            image.alt?.trim() ||
            `${makerName} ${post.name} — image ${index + 1}`,

          // Standardised credit presentation.
          credit: `Courtesy of ${credit.name}`,
          creditName: credit.name,
          creditUrl: credit.url,
        };
      });

      return {
        slug: post.slug,
        name: post.name,
        maker: makerName,
        makerSlug: post.maker,
        reference: post.reference ?? '',
        publishedAt: post.publishedAt,
        images,
      };
    })
    .sort(
      (a, b) =>
        b.publishedAt.localeCompare(a.publishedAt) ||
        a.slug.localeCompare(b.slug)
    );
