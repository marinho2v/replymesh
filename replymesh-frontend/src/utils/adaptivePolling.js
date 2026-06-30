export const scheduleAdaptivePoll = ({
  run,
  visibleMs,
  hiddenMs,
  maxMs = hiddenMs,
}) => {
  let timer = null;
  let stopped = false;
  let errorCount = 0;

  const clear = () => {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const interval = () => {
    const base = document.visibilityState === "hidden" ? hiddenMs : visibleMs;
    return Math.min(base + (Math.min(errorCount, 4) * base), maxMs);
  };

  const schedule = () => {
    clear();
    if (!stopped) timer = window.setTimeout(tick, interval());
  };

  const tick = async () => {
    if (stopped) return;
    try {
      await run();
      errorCount = 0;
    } catch {
      errorCount += 1;
    } finally {
      schedule();
    }
  };

  document.addEventListener("visibilitychange", schedule);
  schedule();

  return () => {
    stopped = true;
    clear();
    document.removeEventListener("visibilitychange", schedule);
  };
};
