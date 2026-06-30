export const getAdaptivePollInterval = ({
  visibleMs,
  hiddenMs,
  errorCount = 0,
  maxMs = hiddenMs,
}) => {
  const base = document.visibilityState === 'hidden' ? hiddenMs : visibleMs
  const backoff = Math.min(errorCount, 4) * base
  return Math.min(base + backoff, maxMs)
}

export const scheduleAdaptivePoll = ({
  run,
  visibleMs,
  hiddenMs,
  maxMs = hiddenMs,
  enabled = true,
}) => {
  let timer = null
  let stopped = false
  let errorCount = 0

  const clear = () => {
    if (timer) {
      window.clearTimeout(timer)
      timer = null
    }
  }

  const schedule = () => {
    clear()
    if (stopped || !enabled) return
    timer = window.setTimeout(tick, getAdaptivePollInterval({ visibleMs, hiddenMs, errorCount, maxMs }))
  }

  const tick = async () => {
    if (stopped || !enabled) return
    try {
      await run()
      errorCount = 0
    } catch {
      errorCount += 1
    } finally {
      schedule()
    }
  }

  const onVisibilityChange = () => schedule()

  document.addEventListener('visibilitychange', onVisibilityChange)
  schedule()

  return () => {
    stopped = true
    clear()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}
