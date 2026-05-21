// ═══════════════════════════════════════════════
// src/components/dashboard/KPICard.jsx
// Single stat card with icon, value, label
// ═══════════════════════════════════════════════

const KPICard = ({
  title,
  value,
  subtitle,
  icon,
  valueColor = 'text-gray-900',
  children,  // optional extra content (progress bar etc)
}) => {
  return (
    <div className="card hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>

      <p className={`text-3xl font-bold ${valueColor} mb-1`}>
        {value}
      </p>

      {subtitle && (
        <p className="text-xs text-gray-400">{subtitle}</p>
      )}

      {children && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
};

export default KPICard;