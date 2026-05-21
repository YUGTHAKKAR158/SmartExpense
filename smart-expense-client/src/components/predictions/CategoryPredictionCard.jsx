// ═══════════════════════════════════════════════
// src/components/predictions/CategoryPredictionCard.jsx
// Shows prediction for a single category
// ═══════════════════════════════════════════════

import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

const TREND_CONFIG = {
  increasing: { icon: '📈', color: 'text-red-500',   label: 'Trending up'   },
  decreasing: { icon: '📉', color: 'text-green-500', label: 'Trending down' },
  stable:     { icon: '➡️', color: 'text-blue-500',  label: 'Stable'        },
};

const CONFIDENCE_CONFIG = {
  high:   { color: 'bg-green-100 text-green-700', label: 'High confidence'   },
  medium: { color: 'bg-yellow-100 text-yellow-700', label: 'Medium confidence' },
  low:    { color: 'bg-gray-100 text-gray-600',   label: 'Low confidence'    },
};

const CategoryPredictionCard = ({ prediction }) => {
  const {
    category, predicted, trend,
    confidence, changePercent,
  } = prediction;

  const color      = CATEGORY_COLORS[category] || '#6b7280';
  const icon       = CATEGORY_ICONS[category]  || '📦';
  const trendConf  = TREND_CONFIG[trend]        || TREND_CONFIG.stable;
  const confConf   = CONFIDENCE_CONFIG[confidence] || CONFIDENCE_CONFIG.low;
  const isIncrease = changePercent > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 hover:shadow-card-hover transition-shadow">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            {icon}
          </div>
          <span className="text-sm font-semibold text-gray-800">
            {category}
          </span>
        </div>

        {/* Confidence badge */}
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${confConf.color}`}>
          {confConf.label}
        </span>
      </div>

      {/* Predicted amount */}
      <p className="text-2xl font-bold text-gray-900 mb-2">
        {formatCurrency(predicted)}
      </p>

      {/* Trend + change */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{trendConf.icon}</span>
          <span className={`text-xs font-medium ${trendConf.color}`}>
            {trendConf.label}
          </span>
        </div>

        {changePercent !== 0 && (
          <span className={`
            text-xs font-bold px-2 py-0.5 rounded-full
            ${isIncrease
              ? 'bg-red-50 text-red-600'
              : 'bg-green-50 text-green-600'
            }
          `}>
            {isIncrease ? '+' : ''}{changePercent}% vs last month
          </span>
        )}
      </div>

    </div>
  );
};

export default CategoryPredictionCard;