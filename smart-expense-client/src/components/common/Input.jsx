// ═══════════════════════════════════════════════
// src/components/common/Input.jsx
//
// Reusable form input with label + error display.
// Used on every form in the entire app.
// ═══════════════════════════════════════════════

const Input = ({
  label,        // Label text above the input
  name,         // Input name attribute
  type = 'text',// Input type (text, email, password, number)
  value,        // Controlled value
  onChange,     // Change handler
  error,        // Error message to display below
  placeholder,
  disabled = false,
  required = false,
  min,
  step,
  ...rest       // Any other props passed through
}) => {
  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label htmlFor={name} className="label">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      {/* Input field */}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        step={step}
        className={`input ${error ? 'border-danger-500 focus:ring-danger-500' : ''}`}
        {...rest}
      />

      {/* Error message */}
      {error && (
        <p className="error-text">{error}</p>
      )}
    </div>
  );
};

export default Input;