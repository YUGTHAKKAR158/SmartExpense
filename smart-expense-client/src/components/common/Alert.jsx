// ═══════════════════════════════════════════════
// src/components/common/Alert.jsx
//
// Displays success or error messages from API calls.
// Used on forms to show backend errors like:
// "Email already exists" or "Invalid password"
// Persistent alert with manual dismiss button
// ═══════════════════════════════════════════════

const Alert = ({ message, type = 'error', onDismiss }) => {
  if (!message) return null;

  const styles = {
    error:   'bg-red-50 border-red-400 text-red-800',
    success: 'bg-green-50 border-green-400 text-green-800',
    warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
  };

  const icons = {
    error:   '❌',
    success: '✅',
    warning: '⚠️',
  };

  return (
    <div className={`
      flex items-start justify-between gap-3
      p-4 rounded-lg border-l-4 border
      ${styles[type]}
    `}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">{icons[type]}</span>
        <p className="text-sm font-semibold leading-relaxed">{message}</p>
      </div>

      {/* Dismiss button — only shows if onDismiss is passed */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-lg leading-none opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;