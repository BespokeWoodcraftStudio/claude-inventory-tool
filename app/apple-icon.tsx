import { ImageResponse } from "next/og";
import { MARK_DATA_URI } from "@/lib/og-mark";

// Apple touch icon (iOS home screen). PNG, since Apple doesn't render SVG icons.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#141210" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK_DATA_URI} width={180} height={180} alt="" />
      </div>
    ),
    { ...size },
  );
}
