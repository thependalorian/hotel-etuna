/**
 * Recorded CRM facts list + staff textarea to add facts (Sofia context)
 *
 * Purpose: Used on guest profile CRM panel; DaisyUI form controls, 44px primary CTA.
 * Location: components/features/crm/GuestCrmFactsSection.tsx
 */

import type { GuestCrmMemoryFact } from '@/components/features/crm/guestCrmPanelTypes';

type Props = {
  facts: GuestCrmMemoryFact[];
  factText: string;
  savingFact: boolean;
  onFactTextChange: (value: string) => void;
  onAddFact: () => void;
};

export default function GuestCrmFactsSection({
  facts,
  factText,
  savingFact,
  onFactTextChange,
  onAddFact,
}: Props) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Recorded facts</h4>
      <ul className="space-y-1 max-h-48 overflow-y-auto text-sm">
        {facts.map((f) => (
          <li key={f.id} className="border-l-4 border-primary/40 pl-2">
            <span className="text-base-content/50">({f.source})</span> {f.factText}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 pt-2">
        <textarea
          className="textarea textarea-bordered w-full min-h-[88px] text-base"
          placeholder="Add a fact for Sofia context…"
          value={factText}
          onChange={(e) => onFactTextChange(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-primary btn-sm min-h-[44px] w-fit"
          disabled={savingFact || !factText.trim()}
          onClick={onAddFact}
        >
          {savingFact ? 'Saving…' : 'Add fact'}
        </button>
      </div>
    </div>
  );
}
