import type { MetadataRoute } from "next";

const siteUrl = "https://tryqualio.pro";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = [
    "",
    "/produit",
    "/pricing",
    "/exemple",
    "/contact",
    "/mentions-legales",
    "/confidentialite",
    "/conditions",
  ];

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
