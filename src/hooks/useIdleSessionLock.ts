import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  idleMs: number;
  warningSeconds: number;
  enabled: boolean;
  onLock: () => void;
};

export function useIdleSessionLock({ idleMs, warningSeconds, enabled, onLock }: Options) {
  const lastActivityRef = useRef(Date.now());
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;

  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(warningSeconds);

  const bumpActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning((open) => {
      if (open) {
        setSecondsLeft(warningSeconds);
      }
      return false;
    });
  }, [warningSeconds]);

  useEffect(() => {
    if (!enabled) return;
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"] as const;
    const handler = () => bumpActivity();
    for (const e of events) {
      window.addEventListener(e, handler, { passive: true });
    }
    return () => {
      for (const e of events) {
        window.removeEventListener(e, handler);
      }
    };
  }, [enabled, bumpActivity]);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      if (showWarning) return;
      if (Date.now() - lastActivityRef.current >= idleMs) {
        setSecondsLeft(warningSeconds);
        setShowWarning(true);
      }
    }, 400);
    return () => window.clearInterval(id);
  }, [enabled, idleMs, warningSeconds, showWarning]);

  useEffect(() => {
    if (!enabled || !showWarning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          queueMicrotask(() => onLockRef.current());
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [enabled, showWarning]);

  const stayActive = useCallback(() => {
    lastActivityRef.current = Date.now();
    setSecondsLeft(warningSeconds);
    setShowWarning(false);
  }, [warningSeconds]);

  return { showWarning, secondsLeft, stayActive };
}
