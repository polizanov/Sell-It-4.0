export const CATEGORIES = [
  'Antiques',
  'Properties',
  'Vehicles',
  'Home and Garden',
  'Electronics',
  'Clothes',
  'Toys',
  'Books',
  'Animals',
  'Work',
  'Makeups',
  'Others',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_ICONS: Record<Category, string> = {
  Antiques: '\u{1F3DB}\uFE0F',
  Properties: '\u{1F3E0}',
  Vehicles: '\u{1F697}',
  'Home and Garden': '\u{1F33F}',
  Electronics: '\u{1F4BB}',
  Clothes: '\u{1F455}',
  Toys: '\u{1F9F8}',
  Books: '\u{1F4DA}',
  Animals: '\u{1F43E}',
  Work: '\u{1F4BC}',
  Makeups: '\u{1F484}',
  Others: '\u{1F4E6}',
};
