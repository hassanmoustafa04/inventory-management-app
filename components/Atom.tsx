export default function Atom({ className = 'atom' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="3">
        <ellipse cx="32" cy="32" rx="26" ry="10.5" />
        <ellipse cx="32" cy="32" rx="26" ry="10.5" transform="rotate(60 32 32)" />
        <ellipse cx="32" cy="32" rx="26" ry="10.5" transform="rotate(120 32 32)" />
      </g>
      <circle cx="32" cy="32" r="6" fill="currentColor" />
    </svg>
  );
}
