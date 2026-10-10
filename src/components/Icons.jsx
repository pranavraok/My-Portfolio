export function Icon({ name, size = 22, ...props }) {
  const paths = {
    music: (
      <>
        <path d="M9 18V5l11-2v13M9 8l11-2" />
        <ellipse cx="6" cy="18" rx="3" ry="2" />
        <ellipse cx="17" cy="16" rx="3" ry="2" />
      </>
    ),
    computer: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 22h8m-4-5v5" />
      </>
    ),
    play: <path d="m8 4 12 8-12 8Z" fill="currentColor" />,
    pause: (
      <>
        <path d="M8 5v14M16 5v14" strokeWidth="4" />
      </>
    ),
    previous: (
      <>
        <path d="M6 5v14m12-14L7 12l11 7Z" fill="currentColor" />
      </>
    ),
    next: (
      <>
        <path d="M18 5v14M6 5l11 7-11 7Z" fill="currentColor" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    back: (
      <>
        <path d="M19 12H5m6-6-6 6 6 6" />
      </>
    ),
    down: (
      <>
        <path d="m6 9 6 6 6-6" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    sound: (
      <>
        <path d="M11 4 6 8H3v8h3l5 4ZM15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" />
      </>
    ),
    mute: (
      <>
        <path d="M11 4 6 8H3v8h3l5 4ZM16 9l5 6m0-6-5 6" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    code: (
      <>
        <path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18" />
      </>
    ),
    github: (
      <>
        <path d="M9 19c-5 1-5-2-7-2m14 5v-4c0-1-.4-2-1-2.5 4-.5 6-2 6-6a5 5 0 0 0-1.5-3.5 5 5 0 0 0 0-4S18 1.5 16 3a13 13 0 0 0-8 0C6 1.5 4.5 2 4.5 2a5 5 0 0 0 0 4A5 5 0 0 0 3 9.5c0 4 2 5.5 6 6-.6.5-1 1.5-1 2.5v4" />
      </>
    ),
    linkedin: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M7 10v7m0-10v.1m4 10v-7m0 3c0-4 6-4 6 0v4" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.arrow}
    </svg>
  );
}

export function Logo() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="12"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 34V14h7a6 6 0 0 1 0 12h-7M28 34V14h4a6 6 0 0 1 0 12h-4m4 0 6 8"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="8" r="4" fill="#e75c60" />
    </svg>
  );
}
