/**
 * BookingPricingDetails — human-readable pricing with optional technical JSON.
 * Location: components/features/booking/BookingPricingDetails.tsx
 */

type BookingPricingDetailsProps = {
  details: Record<string, unknown>;
  currency?: string;
};

function readField(details: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (details[key] !== undefined && details[key] !== null) return details[key];
  }
  return undefined;
}

export function BookingPricingDetails({ details, currency = 'NAD' }: BookingPricingDetailsProps) {
  if (Object.keys(details).length === 0) return null;

  const depositPercent = readField(details, 'depositPercent', 'deposit_percent');
  const depositAmount = readField(details, 'depositAmount', 'deposit_amount');
  const sessionDate = readField(details, 'sessionDate', 'session_date');
  const nightlyRate = readField(details, 'nightlyRate', 'nightly_rate', 'ratePerNight');

  const hasReadable =
    depositPercent != null || depositAmount != null || sessionDate != null || nightlyRate != null;

  return (
    <div className="mb-6">
      <h3 className="font-display text-lg font-semibold mb-3 text-nude-900">Pricing details</h3>
      {hasReadable ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
          {depositPercent != null ? (
            <div className="rounded-lg border border-nude-200 bg-nude-50 p-3">
              <dt className="text-nude-600">Deposit</dt>
              <dd className="font-semibold text-nude-900">{String(depositPercent)}%</dd>
            </div>
          ) : null}
          {depositAmount != null ? (
            <div className="rounded-lg border border-nude-200 bg-nude-50 p-3">
              <dt className="text-nude-600">Deposit amount</dt>
              <dd className="font-semibold text-nude-900">
                {currency} {Number(depositAmount).toFixed(2)}
              </dd>
            </div>
          ) : null}
          {nightlyRate != null ? (
            <div className="rounded-lg border border-nude-200 bg-nude-50 p-3">
              <dt className="text-nude-600">Nightly rate</dt>
              <dd className="font-semibold text-nude-900">
                {currency} {Number(nightlyRate).toFixed(2)}
              </dd>
            </div>
          ) : null}
          {sessionDate != null ? (
            <div className="rounded-lg border border-nude-200 bg-nude-50 p-3">
              <dt className="text-nude-600">Session date</dt>
              <dd className="font-semibold text-nude-900">{String(sessionDate)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <details className="collapse collapse-arrow rounded-lg border border-nude-200 bg-nude-50">
        <summary className="collapse-title min-h-0 py-3 text-sm font-medium text-nude-800">
          Technical details
        </summary>
        <div className="collapse-content">
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}
