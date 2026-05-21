// ═══════════════════════════════════════════════
// src/pages/PredictionsPage.jsx
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { getPredictionsApi } from '../api/predictionApi';
import PredictionTrendChart from '../components/predictions/PredictionTrendChart';
import CategoryPredictionCard from '../components/predictions/CategoryPredictionCard';
import { formatCurrency } from '../utils/formatters';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const TREND_CONFIG = {
  increasing: { icon: '📈', color: 'text-red-500',   bg: 'bg-red-50',   label: 'Spending trending up'   },
  decreasing: { icon: '📉', color: 'text-green-500', bg: 'bg-green-50', label: 'Spending trending down' },
  stable:     { icon: '➡️', color: 'text-blue-500',  bg: 'bg-blue-50',  label: 'Spending is stable'     },
};

const CONFIDENCE_LABELS = {
  high:   '🟢 High — based on 5+ months of data',
  medium: '🟡 Medium — based on 3-4 months of data',
  low:    '🔴 Low — based on 2 months of data',
};

const PredictionsPage = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getPredictionsApi();
        setData(response.data);
      } catch (err) {
        setError('Failed to load predictions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  // ─────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h2>🔮 Spending Predictions</h2>
        </div>
        <div className="space-y-6">
          <div className="card animate-pulse h-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="card animate-pulse h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // NOT ENOUGH DATA
  // ─────────────────────────────────────────
  if (!data?.hasEnoughData) {
    return (
      <div>
        <div className="mb-8">
          <h2>🔮 Spending Predictions</h2>
          <p className="text-gray-500 mt-1">
            Next month spending forecast
          </p>
        </div>

        <div className="card text-center py-16">
          <p className="text-6xl mb-4">🔮</p>
          <h3 className="text-xl font-semibold text-gray-700 mb-3">
            Not Enough Data Yet
          </h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            {data?.message || 'Add expenses across at least 2 months to unlock spending predictions.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto mt-8">
            {[
              { step: '1', text: 'Add expenses this month' },
              { step: '2', text: 'Add expenses next month' },
              { step: '3', text: 'Predictions unlock automatically' },
            ].map((item) => (
              <div key={item.step} className="p-4 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2">
                  {item.step}
                </div>
                <p className="text-xs text-gray-500 text-center">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const {
    overall, categories, budgetComparison,
    trendChartData, nextMonth, nextYear,
  } = data;

  const trendConf = TREND_CONFIG[overall.trend] || TREND_CONFIG.stable;

  return (
    <div>
      {/* ─────────────────────────────────────
          HEADER
          ───────────────────────────────────── */}
      <div className="mb-8">
        <h2>🔮 Spending Predictions</h2>
        <p className="text-gray-500 mt-1">
          Forecast for {MONTH_NAMES[nextMonth - 1]} {nextYear}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* ─────────────────────────────────────
          MAIN PREDICTION CARD
          ───────────────────────────────────── */}
      <div className="card mb-6 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
        <div className="flex flex-wrap items-start justify-between gap-6">

          {/* Left — Big number */}
          <div>
            <p className="text-sm font-medium text-violet-600 mb-2">
              Predicted Total for {MONTH_NAMES[nextMonth - 1]}
            </p>
            <p className="text-5xl font-bold text-gray-900 mb-3">
              {formatCurrency(overall.predicted)}
            </p>

            {/* Trend badge */}
            <div className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
              ${trendConf.bg}
            `}>
              <span>{trendConf.icon}</span>
              <span className={`text-sm font-medium ${trendConf.color}`}>
                {trendConf.label}
              </span>
            </div>
          </div>

          {/* Right — Stats */}
          <div className="space-y-3">

            {/* Change vs last month */}
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">vs last month</p>
              <p className={`text-2xl font-bold ${
                overall.changePercent > 0 ? 'text-red-500' :
                overall.changePercent < 0 ? 'text-green-500' :
                'text-gray-600'
              }`}>
                {overall.changePercent > 0 ? '+' : ''}
                {overall.changePercent}%
              </p>
            </div>

            {/* 3-month average */}
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">3-month average</p>
              <p className="text-lg font-semibold text-gray-700">
                {formatCurrency(overall.movingAverage)}
              </p>
            </div>

            {/* Confidence */}
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">Confidence</p>
              <p className="text-sm font-medium text-gray-600 capitalize">
                {overall.confidence}
              </p>
            </div>

          </div>
        </div>

        {/* Confidence explanation */}
        <div className="mt-4 pt-4 border-t border-violet-100">
          <p className="text-xs text-violet-500">
            {CONFIDENCE_LABELS[overall.confidence]}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────
          BUDGET COMPARISON
          ───────────────────────────────────── */}
      {budgetComparison && (
        <div className={`
          card mb-6 border
          ${budgetComparison.willExceed
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
          }
        `}>
          <div className="flex items-start gap-4">
            <span className="text-3xl flex-shrink-0">
              {budgetComparison.willExceed ? '⚠️' : '✅'}
            </span>
            <div className="flex-1">
              <h3 className={`text-base font-semibold mb-1 ${
                budgetComparison.willExceed ? 'text-red-800' : 'text-green-800'
              }`}>
                {budgetComparison.willExceed
                  ? 'Predicted to Exceed Budget'
                  : 'Predicted to Stay Within Budget'
                }
              </h3>
              <p className={`text-sm mb-3 ${
                budgetComparison.willExceed ? 'text-red-600' : 'text-green-600'
              }`}>
                {budgetComparison.willExceed
                  ? `You're predicted to overspend by ${formatCurrency(Math.abs(budgetComparison.difference))} next month.`
                  : `You're predicted to be ${formatCurrency(Math.abs(budgetComparison.difference))} under budget next month.`
                }
              </p>

              {/* Budget progress bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">
                    Predicted: {formatCurrency(budgetComparison.predicted)}
                  </span>
                  <span className="text-gray-500">
                    Budget: {formatCurrency(budgetComparison.limit)}
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${
                      budgetComparison.willExceed ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(budgetComparison.percentOfBudget, 100)}%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {budgetComparison.percentOfBudget}% of budget
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────
          TREND CHART
          ───────────────────────────────────── */}
      <div className="card mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-1">
          📊 Historical + Predicted Trend
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Bars = actual spending · Dashed line = prediction
        </p>
        <PredictionTrendChart
          data={trendChartData}
          budgetLimit={budgetComparison?.limit || 0}
        />
      </div>

      {/* ─────────────────────────────────────
          CATEGORY PREDICTIONS
          ───────────────────────────────────── */}
      {categories && categories.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            📂 Predictions by Category
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <CategoryPredictionCard
                key={cat.category}
                prediction={cat}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────
          HOW IT WORKS
          ───────────────────────────────────── */}
      <div className="card bg-gray-50 border border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          🧮 How Predictions Work
        </h4>
        <div className="space-y-2 text-xs text-gray-500">
          <p>
            <span className="font-medium text-gray-700">Moving Average: </span>
            Takes your last 3 months of spending and averages them for a stable baseline.
          </p>
          <p>
            <span className="font-medium text-gray-700">Linear Regression: </span>
            Detects whether your spending is trending up, down, or staying stable over time.
          </p>
          <p>
            <span className="font-medium text-gray-700">Weighted Combination: </span>
            The final prediction blends both — more historical data means regression gets more weight.
          </p>
          <p>
            <span className="font-medium text-gray-700">Confidence: </span>
            High with 5+ months of data, Medium with 3-4 months, Low with 2 months.
          </p>
        </div>
      </div>

    </div>
  );
};

export default PredictionsPage;