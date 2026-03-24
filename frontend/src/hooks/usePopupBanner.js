import { useCallback, useEffect, useRef, useState } from "react";
import { getActivePopupBanner } from "../services/popupBannerService";

const POPUP_SEEN_KEY = "popup_seen_today";

const getTodayKey = () => new Date().toDateString();

const parseSeenRecord = () => {
  try {
    const rawValue = localStorage.getItem(POPUP_SEEN_KEY);
    if (!rawValue) return null;

    try {
      const parsed = JSON.parse(rawValue);
      if (parsed && typeof parsed === "object") {
        return {
          date: parsed.date || "",
          bannerId: Number(parsed.bannerId) || null,
          version: Number(parsed.version) || 1,
        };
      }
    } catch {
      // Legacy format (plain date string) is ignored to prevent stale blocking.
      return null;
    }

    return null;
  } catch {
    return null;
  }
};

const markPopupSeenToday = (bannerId) => {
  try {
    localStorage.setItem(
      POPUP_SEEN_KEY,
      JSON.stringify({
        date: getTodayKey(),
        bannerId: Number(bannerId) || null,
        version: 2,
      }),
    );
  } catch {
    // Ignore localStorage errors (e.g. private mode restrictions)
  }
};

const hasSeenCurrentBannerToday = (bannerId) => {
  if (!bannerId) return false;

  const seenRecord = parseSeenRecord();
  if (!seenRecord) return false;

  return (
    seenRecord.date === getTodayKey() && Number(seenRecord.bannerId) === Number(bannerId)
  );
};

function usePopupBanner({ showDelayMs = 1200 } = {}) {
  const [banner, setBanner] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dontShowToday, setDontShowToday] = useState(false);
  const delayTimerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadPopupBanner = async () => {
      try {
        setIsLoading(true);
        const data = await getActivePopupBanner();

        if (!isMounted) return;

        const hasValidBanner = Boolean(data && data.id && data.image_url);
        if (!hasValidBanner) {
          setIsLoading(false);
          return;
        }

        if (hasSeenCurrentBannerToday(data.id)) {
          setBanner(data);
          setIsOpen(false);
          setIsLoading(false);
          return;
        }

        setBanner(data);
        delayTimerRef.current = setTimeout(() => {
          if (!isMounted) return;
          setIsOpen(true);
          setIsLoading(false);
        }, showDelayMs);
      } catch {
        if (!isMounted) return;
        setBanner(null);
        setIsOpen(false);
        setIsLoading(false);
      }
    };

    loadPopupBanner();

    return () => {
      isMounted = false;
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }
    };
  }, [showDelayMs]);

  const closePopup = useCallback(
    ({ rememberToday = dontShowToday, bannerId } = {}) => {
      if (rememberToday && bannerId) {
        markPopupSeenToday(bannerId);
      }
      setIsOpen(false);
    },
    [dontShowToday],
  );

  return {
    banner,
    isOpen,
    isLoading,
    dontShowToday,
    setDontShowToday,
    closePopup,
  };
}

export default usePopupBanner;
