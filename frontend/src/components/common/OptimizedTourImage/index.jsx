import { useMemo, useState } from "react";

const DEFAULT_PLACEHOLDER =
  "https://placehold.co/800x500?text=Tour+Image";

/**
 * Centralized image renderer for tour-related UIs.
 * - Uses lazy-loading by default for better LCP on non-critical images.
 * - Keeps a safe fallback image when source is broken/missing.
 * - Allows callers to opt out via loading="eager" for critical cases.
 */
function OptimizedTourImage({
  src,
  alt,
  className,
  fallbackSrc = DEFAULT_PLACEHOLDER,
  loading = "lazy",
  decoding = "async",
  fetchPriority,
}) {
  const [hasError, setHasError] = useState(false);

  const finalSrc = useMemo(() => {
    if (hasError) return fallbackSrc;
    return src || fallbackSrc;
  }, [fallbackSrc, hasError, src]);

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      onError={() => setHasError(true)}
    />
  );
}

export default OptimizedTourImage;