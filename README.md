# SANDERSON KNIGHTS

## Architecture

- Astro — Static website
- Cloudflare Pages — Hosting and deployment
- Cloudflare R2 — Photograph storage
- Pages CMS — Content management
- GitHub — Source control and structured content

## Pages

- Gallery — Chronological exhibition feed
- Archive — Maker directory and filtered exhibitions
- About — Introduction

## Content Management

Exhibitions and makers are managed through Pages CMS.

Configuration: `.pages.yml`

Content:
- `src/content/makers/`
- `src/content/exhibitions/`

Photographs are stored separately in Cloudflare R2.

Each exhibition contains an ordered collection of images,
with default attribution and optional per-image overrides.

Only published exhibitions with approved publication rights
appear on the website.

## Local Development

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

The build includes content validation.

## Deployment

Changes pushed to the main branch trigger automatic
deployment through Cloudflare Pages.

Production: https://sandersonknights.com

Media: https://media.sandersonknights.com

## Credits

Originally developed using the Astro Photo Folio template
by XD-QIN.

See LICENSE for applicable licensing information.
