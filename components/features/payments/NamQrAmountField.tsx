/**
 * NamQrAmountField — NAD amount input shared by desk and guest NamQR panels.
 * Location: components/features/payments/NamQrAmountField.tsx
 */

type NamQrAmountFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: string;
};

export function NamQrAmountField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max,
  step = '0.01',
}: NamQrAmountFieldProps) {
  return (
    <label className="form-control w-full" htmlFor={id}>
      <span className="label-text">{label}</span>
      <input
        id={id}
        type="number"
        step={step}
        min={min}
        max={max}
        className="input input-bordered w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
