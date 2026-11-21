
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const makersDir = path.join(root, 'src/content/makers');
const exhibitionsDir = path.join(root, 'src/content/exhibitions');
const publicDir = path.join(root, 'public');

const errors = [];
const warnings = [];

function readCollection(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const fullPath = path.join(directory, file);

      try {
        return {
          file,
          data: JSON.parse(fs.readFileSync(fullPath, 'utf8')),
        };
      } catch (error) {
        errors.push(`${file}: Invalid JSON — ${error.message}`);
        return null;
      }
    })
    .filter(Boolean);
}

function validURL(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function validUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validateIdentity(records, collection) {
  const seen = new Set();

  for (const { file, data } of records) {
    if (!data.id) {
      warnings.push(`${collection}/${file}: Missing UUID`);
      continue;
    }

    if (!validUUID(data.id)) {
      errors.push(`${collection}/${file}: Invalid UUID`);
    }

    if (seen.has(data.id)) {
      errors.push(`${collection}/${file}: Duplicate UUID`);
    }

    seen.add(data.id);
  }
}

function checkImage(src, label) {
  if (typeof src !== 'string' || !src.trim()) {
    errors.push(`${label}: Missing image source`);
    return;
  }

  // Remotely hosted images cannot be checked locally.
  if (validURL(src)) return;

  if (!src.startsWith('/') || src.startsWith('//')) {
    errors.push(`${label}: Invalid local image path`);
    return;
  }

  const relative = src.slice(1);
  const absolute = path.resolve(publicDir, relative);

  if (!absolute.startsWith(publicDir + path.sep)) {
    errors.push(`${label}: Image path escapes public directory`);
    return;
  }

  if (!fs.existsSync(absolute)) {
    errors.push(`${label}: Image file not found — ${src}`);
  }
}

const makers = readCollection(makersDir);
const exhibitions = readCollection(exhibitionsDir);

validateIdentity(makers, 'makers');
validateIdentity(exhibitions, 'exhibitions');

const makerSlugs = new Set();

for (const { file, data } of makers) {
  if (!data.name || !data.slug) {
    errors.push(`makers/${file}: Missing name or slug`);
    continue;
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.push(`makers/${file}: Invalid maker slug`);
  }

  if (makerSlugs.has(data.slug)) {
    errors.push(`makers/${file}: Duplicate maker slug`);
  }

  makerSlugs.add(data.slug);
}

const exhibitionSlugs = new Set();

for (const { file, data } of exhibitions) {
  const label = `exhibitions/${file}`;
  const slug = data.slug || path.basename(file, '.json');

  if (exhibitionSlugs.has(slug)) {
    errors.push(`${label}: Duplicate exhibition slug`);
  }

  exhibitionSlugs.add(slug);

  if (!data.name || !data.maker) {
    errors.push(`${label}: Missing watch name or maker`);
  }

  if (data.maker && !makerSlugs.has(data.maker)) {
    errors.push(`${label}: Unknown maker — ${data.maker}`);
  }

  if (!['draft', 'published'].includes(data.status)) {
    errors.push(`${label}: Invalid publishing status`);
  }

  if (!['pending', 'approved', 'restricted'].includes(data.rightsStatus)) {
    errors.push(`${label}: Invalid rights status`);
  }

  if (
    typeof data.publishedAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data.publishedAt)
  ) {
    errors.push(`${label}: Invalid publication date format`);
  }

  const isPublic =
    data.status === 'published' &&
    data.rightsStatus === 'approved';

  if (data.status === 'published' && !isPublic) {
    warnings.push(`${label}: Published but rights not approved`);
  }

  // Only require complete image and credit data
  // when an exhibition is ready to appear publicly.
  if (!isPublic) continue;

  if (
    !data.attribution?.name ||
    !validURL(data.attribution?.url)
  ) {
    errors.push(`${label}: Invalid default attribution`);
  }

  if (
    !Array.isArray(data.images) ||
    data.images.length < 3 ||
    data.images.length > 8
  ) {
    errors.push(`${label}: Published exhibition requires 3–8 images`);
    continue;
  }

  data.images.forEach((image, index) => {
    const imageLabel = `${label} image ${index + 1}`;

    checkImage(image.src, imageLabel);

    const override = image.attribution;

    if (override && (override.name || override.url)) {
      if (!override.name || !validURL(override.url)) {
        errors.push(`${imageLabel}: Incomplete attribution override`);
      }
    }
  });
}

console.log('\nSANDERSON KNIGHTS — CONTENT VALIDATION\n');

console.log(`Makers: ${makers.length}`);
console.log(`Exhibitions: ${exhibitions.length}`);

for (const warning of warnings) {
  console.warn(`WARNING: ${warning}`);
}

for (const error of errors) {
  console.error(`ERROR: ${error}`);
}

if (errors.length > 0) {
  console.error(`\nValidation failed: ${errors.length} error(s).`);
  process.exitCode = 1;
} else {
  console.log('\nValidation passed.');
}
