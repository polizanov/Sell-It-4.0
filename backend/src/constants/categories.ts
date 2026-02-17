export const PRODUCT_CATEGORIES = [
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

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
