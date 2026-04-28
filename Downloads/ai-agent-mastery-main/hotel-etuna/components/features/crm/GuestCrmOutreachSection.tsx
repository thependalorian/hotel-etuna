/**
 * Outreach touches — new draft, channel picker, lifecycle actions (schedule / sent / cancel)
 *
 * Purpose: CRM marketing touch UI for a single guest; respects server-side consent validation.
 * Location: components/features/crm/GuestCrmOutreachSection.tsx
 */

import type { GuestCrmOutreachTouch, GuestCrmTouchStatusAction } from '@/components/features/crm/guestCrmPanelTypes';

type Props = {
  touches: GuestCrmOutreachTouch[];
  channel: string;
  onChannelChange: (channel: string) => void;
  creatingTouch: boolean;
  actionTouchId: string | null;
  onCreateDraft: () => void;
  onTransitionTouch: (touchId: string, status: GuestCrmTouchStatusAction) => void;
};

export default function GuestCrmOutreachSection({
  touches,
  channel,
  onChannelChange,
  creatingTouch,
  actionTouchId,
  onCreateDraft,
  onTransitionTouch,
}: Props) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold">Outreach touches</h4>
      <div className="flex flex-wrap items-end gap-2">
        <label className="form-control">
          <span className="label-text text-xs">Channel</span>
          <select
            className="select select-bordered select-sm min-h-[44px]"
            value={channel}
            onChange={(e) => onChannelChange(e.target.value)}
          >
            <option value="email">email</option>
            <option value="sms">sms</option>
            <option value="whatsapp">whatsapp</option>
            <option value="other">other</option>
          </select>
        </label>
        <button
          type="button"
          className="btn btn-outline btn-sm min-h-[44px]"
          disabled={creatingTouch}
          onClick={onCreateDraft}
        >
          {creatingTouch ? 'Creating…' : 'New draft'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-sm table-zebra">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {touches.map((t) => (
              <tr key={t.id}>
                <td>{t.channel}</td>
                <td>
                  <span className="badge badge-ghost">{t.status}</span>
                </td>
                <td className="text-xs text-base-content/60">{t.updatedAt ?? '—'}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {t.status === 'draft' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-xs btn-primary min-h-[32px]"
                          disabled={actionTouchId === t.id}
                          onClick={() => onTransitionTouch(t.id, 'scheduled')}
                        >
                          Schedule
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs min-h-[32px]"
                          disabled={actionTouchId === t.id}
                          onClick={() => onTransitionTouch(t.id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {t.status === 'scheduled' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-xs btn-success min-h-[32px]"
                          disabled={actionTouchId === t.id}
                          onClick={() => onTransitionTouch(t.id, 'sent')}
                        >
                          Mark sent
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs min-h-[32px]"
                          disabled={actionTouchId === t.id}
                          onClick={() => onTransitionTouch(t.id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {touches.length === 0 && (
          <p className="text-sm text-base-content/60 py-2">No touches yet for this guest.</p>
        )}
      </div>
    </div>
  );
}
