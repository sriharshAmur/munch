/** The wordmark's mark: a round plate in lamp amber with one bite out of it. */
export function BiteMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <defs>
        <mask id="bite">
          <rect width="28" height="28" fill="white" />
          <circle cx="23.5" cy="5.5" r="5" fill="black" />
          <circle cx="26.5" cy="12" r="3.4" fill="black" />
          <circle cx="17.5" cy="2.5" r="3.2" fill="black" />
        </mask>
      </defs>
      <circle cx="14" cy="14" r="12" fill="var(--m-accent)" mask="url(#bite)" />
      <circle cx="14" cy="14" r="6.5" fill="none" stroke="var(--m-accent-fg)" strokeOpacity=".22" strokeWidth="1.5" mask="url(#bite)" />
    </svg>
  );
}
