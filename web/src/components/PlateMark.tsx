export function PlateMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" />
      <circle
        cx="14"
        cy="14"
        r="8"
        fill="none"
        stroke="currentColor"
        opacity=".3"
      />
      <path
        d="M 2 14 A 12 12 0 0 1 5.5 5.5"
        fill="none"
        stroke="var(--m-accent)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
