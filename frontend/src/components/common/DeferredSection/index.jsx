import { useEffect, useRef, useState } from "react";

/**
 * Render section content only when it is near viewport.
 * This keeps below-fold component code/data out of the initial critical path.
 */
function DeferredSection({
  children,
  placeholder = null,
  rootMargin = "220px",
  triggerOnce = true,
}) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible && triggerOnce) return;
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        setIsVisible(true);

        if (triggerOnce) {
          observer.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0.01 },
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [isVisible, rootMargin, triggerOnce]);

  return <div ref={containerRef}>{isVisible ? children : placeholder}</div>;
}

export default DeferredSection;
