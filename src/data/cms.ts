
import type {
  Attribution,
  CMSExhibition,
  Exhibition,
  Maker,
} from './exhibitions';

// Read all maker records created by Pages CMS.
const makerFiles = import.meta.glob<Maker>(
  '../content/makers/*.json',
  { eager: true, import: 'default' }
);

// Read all exhibition records.
const exhibitionFiles = import.meta.glob<CMSExhibition>(
  '../content/exhibitions/*.json',
  { eager: true, import: 'default' }
);

export const makers: Maker[] = Object.values(
  makerFiles
).sort((a, b) => a.name.localeCompare(b.name));

const makerMap = new Map(
  makers.map((maker) => [maker.slug, maker.name])
);

function resolveAttribution(
  imageCredit: Attribution | null | undefined,
  defaultCredit: Attribution
): Attribution {
  if (!imageCredit ||
      (!imageCredit.name && !imageCredit.url)) {
    return defaultCredit;
  }

  // A custom attribution must have BOTH fields.
  if (!imageCredit.name || !imageCredit.url) {
    throw new Error(
      'Image attribution override requires name and URL.'
    );
  }

  return imageCredit;
}

export const publishedExhibitions: Exhibition[] =
  Object.values(exhibitionFiles)
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

      if (!post.attribution?.name ||
          !post.attribution?.url) {
        throw new Error(
          `Missing default attribution in ${post.slug}`
        );
      }

      if (!/^https?:\/\/.+/i.test(post.attribution.url)) {
        throw new Error(
          `Invalid attribution URL in ${post.slug}`
        );
      }

      if (!Array.isArray(post.images) ||
          post.images.length < 3 ||
          post.images.length > 8) {
        throw new Error(
          `${post.slug} requires 3–8 photographs.`
        );
      }

      const images = post.images.map((image) => {
        const credit = resolveAttribution(
          image.attribution,
          post.attribution
        );

        if (!image.src || !image.alt ||
            !/^https?:\/\/.+/i.test(credit.url)) {
          throw new Error(
            `Invalid image data in ${post.slug}`
          );
        }

        return {
          src: image.src,
          full: image.src,
          alt: image.alt,
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
    .sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt) ||
      a.slug.localeCompare(b.slug)
    );
