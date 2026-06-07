const I = ({ d, s = 24, sw = 1.8, fill = 'none', children, ...p }) => (
  <svg
    width={s} height={s} viewBox="0 0 24 24"
    fill={fill} stroke={fill === 'none' ? 'currentColor' : 'none'}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}
  >
    {d ? <path d={d} /> : children}
  </svg>
)

export const IconBag = (p) => (
  <I {...p}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </I>
)

export const IconWhatsApp = ({ s = 24, ...p }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.8c2.16 0 4.18.84 5.71 2.37a8.04 8.04 0 0 1 2.37 5.72c0 4.46-3.63 8.09-8.1 8.09a8.1 8.1 0 0 1-4.12-1.13l-.3-.18-3.12.82.83-3.04-.19-.31a8.05 8.05 0 0 1-1.24-4.3c0-4.46 3.63-8.09 8.09-8.09l.06-.05Z" />
  </svg>
)

export const IconCart = (p) => (
  <I {...p}>
    <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none" />
    <circle cx="20" cy="21" r="1" fill="currentColor" stroke="none" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </I>
)

export const IconMenu = (p) => <I {...p} d="M3 12h18M3 6h18M3 18h18" />

export const IconTruck = (p) => (
  <I {...p}>
    <path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7" />
    <circle cx="5.5" cy="18.5" r="2" /><circle cx="18.5" cy="18.5" r="2" />
  </I>
)

export const IconShield = (p) => (
  <I {...p}>
    <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5Z" />
    <path d="m9 12 2 2 4-4" />
  </I>
)

export const IconStar = ({ s = 24, ...p }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z" />
  </svg>
)

export const IconSearch = (p) => (
  <I {...p}>
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
  </I>
)

export const IconClock = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </I>
)

export const IconPlus = (p) => <I {...p} d="M12 5v14M5 12h14" />
export const IconMinus = (p) => <I {...p} d="M5 12h14" />
export const IconClose = (p) => <I {...p} d="M18 6 6 18M6 6l12 12" />
export const IconCheck = (p) => <I {...p} d="M20 6 9 17l-5-5" />
export const IconPhone = (p) => <I {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />

export const IconInsta = (p) => (
  <I {...p}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </I>
)
