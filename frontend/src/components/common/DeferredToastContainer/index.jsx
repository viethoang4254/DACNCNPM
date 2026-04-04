import { Suspense, lazy, useEffect, useState } from "react";

// Load toast runtime + CSS only when browser is idle to protect first paint/LCP.
const ToastContainer = lazy(() =>
  Promise.all([
    import("react-toastify"),
    import("react-toastify/dist/ReactToastify.css"),
  ]).then(([toastify]) => ({ default: toastify.ToastContainer })),
);

function DeferredToastContainer() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let timeoutId = null;
    let idleId = null;

    const enableToast = () => setEnabled(true);

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(enableToast, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(enableToast, 300);
    }

    return () => {
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <ToastContainer position="top-right" autoClose={2500} newestOnTop />
    </Suspense>
  );
}

export default DeferredToastContainer;
