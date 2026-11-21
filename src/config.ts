
/**
 * Site Configuration
 */

export interface NavItem {
  label: string;
  href: string;
}

export const site = {
  name: 'SANDERSON KNIGHTS',
  nameZh: '',
  title: 'SANDERSON KNIGHTS',
  description: 'AN INDEPENDENT VISUAL CURATION OF HOROLOGY.',
};

export const nav: NavItem[] = [
  { label: 'GALLERY', href: '/' },
  { label: 'ARCHIVE', href: '/archive' },
  { label: 'ABOUT', href: '/about' },
];
