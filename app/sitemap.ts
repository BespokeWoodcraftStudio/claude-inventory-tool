import type { MetadataRoute } from "next";
import { SITE_URL } from "@/components/inventory/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE_URL, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/setup`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/inventory`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/faq`, lastModified, changeFrequency: "monthly", priority: 0.6 },
  ];
}
