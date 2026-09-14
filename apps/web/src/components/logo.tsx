export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#c7ff5e" />
      <path d="M8.5 22V10h3.9l7.2 7.7V10h3.9v12h-3.6l-7.5-7.9V22H8.5Z" fill="#10140d" />
      <path d="M23.5 7.2v4.1l-4.1-4.1h4.1Z" fill="#fff" fillOpacity=".88" />
    </svg>
  );
}
