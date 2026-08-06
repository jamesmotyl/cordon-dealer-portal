// Placeholder wordmark — swap the contents of this component for the real
// Cordon logo SVG when it's available. Keep the component name/export so
// callers (Header, /login) don't need to change.
export default function CordonLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-1 font-semibold tracking-tight ${className}`}>
      <span className="text-navy">Cordon</span>
      <span className="h-1.5 w-1.5 rounded-full bg-orange" />
    </span>
  );
}
