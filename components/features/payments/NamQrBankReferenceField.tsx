/**
 * NamQrBankReferenceField — bank reference capture after guest pays via NamQR.
 * Location: components/features/payments/NamQrBankReferenceField.tsx
 */

type NamQrBankReferenceFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function NamQrBankReferenceField({
  id,
  label,
  value,
  onChange,
  placeholder = 'e.g. payment confirmation number',
}: NamQrBankReferenceFieldProps) {
  return (
    <label className="form-control w-full" htmlFor={id}>
      <span className="label-text">{label}</span>
      <input
        id={id}
        type="text"
        className="input input-bordered w-full"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
