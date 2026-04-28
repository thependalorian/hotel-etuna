/**
 * Mem0 memory summaries list (when integration is configured)
 *
 * Purpose: Displays external long-term memory lines returned with guest CRM memory bundle.
 * Location: components/features/crm/GuestCrmMem0Section.tsx
 */

export default function GuestCrmMem0Section({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Mem0 summaries</h4>
      <ul className="list-disc list-inside text-sm text-base-content/80">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
