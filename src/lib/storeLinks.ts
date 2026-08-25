const STORE_ORIGIN = 'https://www.peptide-south-africa.com';

export type StoreCategory = 'all' | 'weight-loss' | 'longevity' | 'recovery' | 'skin-hair';

const CATEGORY_PATHS: Record<StoreCategory, string> = {
  all: '/shop',
  'weight-loss': '/shop?category=GLP',
  longevity: '/shop?category=Longevity',
  recovery: '/shop?category=Healing',
  'skin-hair': '/shop?category=Skin+%26+Hair',
};

function withAttribution(path: string, placement: string): string {
  const url = new URL(path, STORE_ORIGIN);
  url.searchParams.set('utm_source', 'psa_app');
  url.searchParams.set('utm_medium', 'dashboard');
  url.searchParams.set('utm_campaign', 'customer_journey');
  url.searchParams.set('utm_content', placement);
  return url.toString();
}

export function getStoreCategoryHref(category: StoreCategory, placement: string): string {
  return withAttribution(CATEGORY_PATHS[category], placement);
}

export function getStoreProductHref(productSlug: string, placement: string): string {
  const safeSlug = productSlug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(safeSlug)) {
    return getStoreCategoryHref('all', placement);
  }
  return withAttribution(`/products/${safeSlug}`, placement);
}

export const VERIFIED_STORE_PATHS = Object.freeze({ ...CATEGORY_PATHS });
