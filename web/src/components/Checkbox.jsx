export default function Checkbox({ checked, onChange, label, sub, disabled }) {
  return (
    <label className="checkbox-row">
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <div className="checkbox-body">
        <span className="checkbox-label">{label}</span>
        {sub && <span className="checkbox-sub">{sub}</span>}
      </div>
    </label>
  )
}
