import { useMemo } from "react";
import "./TourOverview.scss";

const HIGHLIGHT_TITLES = [
  "DIEM NOI BAT NHAT",
  "CHUONG TRINH CO GI HAP DAN",
  "DIEM NOI BAT TRONG TOUR",
  "DIEM NOI BAT CUA TOUR",
  "DIEM NOI BAT",
];

function toAsciiUpper(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function splitSentences(text) {
  return String(text || "")
    .split(/\.(?=\s+[A-ZA-ZÀ-ỹ])|[\n;]/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/[.,;:!?]+$/g, "").trim())
    .filter((item) => item.length >= 5);
}

function extractBulletLines(text) {
  return String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter((line) => line.length >= 3);
}

function extractInlineDashBullets(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  if (!/\s-\s/.test(normalized)) {
    return [];
  }

  const segments = normalized
    .split(/\s-\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/[.,;:!?]+$/g, "").trim())
    .filter((item) => item.length >= 3);

  return segments.length >= 2 ? segments : [];
}

function parseOverview(rawText) {
  const text = String(rawText || "")
    .replace(/\r/g, "")
    .replace(/\*\s+/g, "*")
    .trim();

  if (!text) {
    return {
      paragraphs: ["Nội dung đang được cập nhật."],
      highlightTitle: "",
      highlights: [],
    };
  }

  const normalized = toAsciiUpper(text);
  let markerIndex = -1;

  for (const title of HIGHLIGHT_TITLES) {
    const token = `${title}:`;
    const index = normalized.indexOf(token);
    if (index >= 0 && (markerIndex === -1 || index < markerIndex)) {
      markerIndex = index;
    }
  }

  if (markerIndex === -1) {
    const paragraphs = text
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      paragraphs: paragraphs.length ? paragraphs : [text],
      highlightTitle: "",
      highlights: [],
    };
  }

  const intro = text.slice(0, markerIndex).replace(/\*+\s*$/g, "").trim();
  const body = text.slice(markerIndex);
  const markerRegex = /^\*?\s*([^:]+):\s*/;
  const markerMatch = body.match(markerRegex);

  const highlightTitle = (markerMatch?.[1] || "Điểm nổi bật trong tour")
    .trim()
    .replace(/^\*+\s*/, "")
    .replace(/\*+$/g, "");

  const highlightText = body.replace(markerRegex, "").trim();
  const inlineDashBullets = extractInlineDashBullets(highlightText);
  const bulletLines = extractBulletLines(highlightText);
  const highlights =
    inlineDashBullets.length >= 2
      ? inlineDashBullets
      : bulletLines.length >= 2
        ? bulletLines
        : splitSentences(highlightText);

  const introParagraphs = intro
    ? intro
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return {
    paragraphs: introParagraphs,
    highlightTitle,
    highlights,
  };
}

function isTopHighlightTitle(title) {
  return toAsciiUpper(title).includes("DIEM NOI BAT NHAT");
}

function TourOverview({ tour }) {
  const overview = useMemo(() => parseOverview(tour?.mo_ta), [tour?.mo_ta]);
  const isTopHighlight = isTopHighlightTitle(overview.highlightTitle);

  return (
    <section className="tour-detail__section card tour-overview" aria-label="Giới thiệu tour">
      <h3>Giới thiệu tour</h3>

      {overview.paragraphs.map((paragraph, index) => (
        <p key={`overview-paragraph-${index}`}>{paragraph}</p>
      ))}

      {overview.highlights.length > 0 ? (
        <div
          className={`tour-overview__highlights${
            isTopHighlight ? " tour-overview__highlights--top" : ""
          }`}
        >
          <h4>{overview.highlightTitle}:</h4>
          <ul>
            {overview.highlights.map((item, index) => (
              <li key={`overview-highlight-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default TourOverview;
