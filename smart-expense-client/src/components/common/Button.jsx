// ═══════════════════════════════════════════════
// src/components/common/Button.jsx
//
// Reusable button with loading spinner support.
// Shows a spinner and disables itself while loading.
// ═══════════════════════════════════════════════

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',   // primary | secondary | danger
  loading = false,       // shows spinner when true
  disabled = false,
  fullWidth = false,
  size = 'md',           // sm | md | lg
  ...rest
}) => {
  // Map variant to CSS class
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  };

  // Map size to padding/text classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full justify-center' : ''}
        inline-flex items-center gap-2
      `}
      {...rest}
    >
      {/* Loading spinner */}
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;