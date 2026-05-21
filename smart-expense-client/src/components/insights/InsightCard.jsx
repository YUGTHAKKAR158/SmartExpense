// ═══════════════════════════════════════════════
// src/components/insights/InsightCard.jsx
// Single insight card with type-based styling
// ═══════════════════════════════════════════════

const TYPE_STYLES = {
  danger: {
    border: 'border-l-red-500',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-700',
    value: 'text-red-700',
    label: 'Critical',
  },
  warning: {
    border: 'border-l-yellow-500',
    bg: 'bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-700',
    value: 'text-yellow-700',
    label: 'Warning',
  },
  success: {
    border: 'border-l-green-500',
    bg: 'bg-green-50',
    badge: 'bg-green-100 text-green-700',
    value: 'text-green-700',
    label: 'Great',
  },
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    value: 'text-blue-700',
    label: 'Info',
  },
};

const InsightCard = ({ insight }) => {
  const style = TYPE_STYLES[insight.type] || TYPE_STYLES.info;

  return (
    <div className={`
      bg-white rounded-xl border border-gray-100
      border-l-4 ${style.border}
      shadow-card hover:shadow-card-hover
      transition-shadow duration-200
      p-5
    `}>
      <div className="flex items-start gap-4">

        {/* Icon */}
        <div className={`
          w-11 h-11 rounded-xl flex items-center justify-center
          flex-shrink-0 text-xl
          ${style.bg}
        `}>
          {insight.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-gray-900 leading-snug">
              {insight.title}
            </h4>
            <span className={`
              text-xs font-medium px-2 py-0.5 rounded-full
              flex-shrink-0 ${style.badge}
            `}>
              {style.label}
            </span>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            {insight.message}
          </p>

          {/* Key value highlight */}
          {insight.value && (
            <div className={`
              inline-flex items-center gap-1.5
              text-sm font-bold ${style.value}
            `}>
              <span>→</span>
              <span>{insight.value}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default InsightCard;