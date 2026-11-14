/**
 * Props of the page views in this folder. Views are ordinary page components
 * that take the language as a prop; the route files under app/(id) and app/en
 * call them with a fixed locale, so every public route is static.
 */
export type ViewProps = { params: Promise<{ locale: string }> };
export type SlugViewProps = { params: Promise<{ locale: string; slug: string }> };
export type CatalogViewProps = ViewProps & {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
