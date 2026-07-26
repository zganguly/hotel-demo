import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const GOLD = "#D6AE73";
const GOLD_BRIGHT = "#E7C990";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #1D3449 0%, #0B1420 100%)",
        }}
      >
        {/* Moon */}
        <div
          style={{
            position: "absolute",
            top: 26,
            right: 30,
            width: 30,
            height: 30,
            borderRadius: 30,
            background: GOLD,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 24,
            width: 28,
            height: 28,
            borderRadius: 28,
            background: "#152A40",
          }}
        />
        {/* Tower */}
        <div
          style={{
            position: "absolute",
            left: 52,
            top: 56,
            width: 76,
            height: 96,
            display: "flex",
            flexWrap: "wrap",
            alignContent: "flex-start",
            justifyContent: "space-between",
            padding: "14px 12px",
            border: `6px solid ${GOLD}`,
            borderRadius: 10,
            background: "#16273C",
          }}
        >
          <div style={{ width: 18, height: 22, borderRadius: 4, background: GOLD_BRIGHT }} />
          <div
            style={{
              width: 18,
              height: 22,
              borderRadius: 4,
              background: GOLD_BRIGHT,
              opacity: 0.45,
            }}
          />
          <div
            style={{
              width: 18,
              height: 22,
              borderRadius: 4,
              background: GOLD_BRIGHT,
              opacity: 0.8,
              marginTop: 8,
            }}
          />
          <div
            style={{
              width: 18,
              height: 22,
              borderRadius: 4,
              background: GOLD_BRIGHT,
              marginTop: 8,
            }}
          />
        </div>
        {/* Entrance */}
        <div
          style={{
            position: "absolute",
            left: 79,
            top: 128,
            width: 22,
            height: 24,
            borderRadius: "11px 11px 0 0",
            background: GOLD,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
