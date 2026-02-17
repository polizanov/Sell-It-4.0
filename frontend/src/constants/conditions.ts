export const PRODUCT_CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const;
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];
