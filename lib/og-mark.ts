// The clay "inventory" mark from public/favicon.svg, as a base64 data URI so it
// can be dropped into next/og ImageResponse via <img> (Satori renders SVG data
// URIs reliably without needing a loaded font).
const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
  '<rect width="32" height="32" rx="8" fill="#c15a33"/>' +
  '<g fill="none" stroke="#1a0f0a" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round">' +
  '<path d="M16 6 7 10.5l9 4.5 9-4.5L16 6Z"/>' +
  '<path d="M7 16l9 4.5L25 16"/>' +
  '<path d="M7 21l9 4.5L25 21"/>' +
  "</g></svg>";

export const MARK_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(SVG).toString("base64")}`;
