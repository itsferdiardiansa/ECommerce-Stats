/**
 * Live region for form-level (server) errors. The container is always rendered
 * so screen readers announce the message when it appears.
 */
export function FormError({ message }: { message?: string | null }) {
  return (
    <div aria-live="polite" className="min-h-0">
      {message ? (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
