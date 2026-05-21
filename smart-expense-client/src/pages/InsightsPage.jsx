// ═══════════════════════════════════════════════
// src/pages/InsightsPage.jsx
// ═══════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { getInsightsApi } from '../api/insightsApi';
import InsightCard from '../components/insights/InsightCard';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// Filter tabs
const FILTER_TYPES = [
  { label: 'All',      value: 'all',     icon: '🔍' },
  { label: 'Critical', value: 'danger',  icon: '🚨' },
  { label: 'Warnings', value: 'warning', icon: '⚠️'  },
  { label: 'Good News',value: 'success', icon: '✅'  },
  { label: 'Info',     value: 'info',    icon: 'ℹ️'  },
];

const InsightsPage = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const [insights,      setInsights]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [activeFilter,  setActiveFilter]  = useState('all');

  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();
  const yearOptions  = [currentYear - 1, currentYear];

  // ─────────────────────────────────────────
  // FETCH INSIGHTS
  // ─────────────────────────────────────────
  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getInsightsApi(selectedMonth, selectedYear);
      setInsights(response.data.insights || []);
    } catch (err) {
      setError('Failed to load insights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // ─────────────────────────────────────────
  // FILTER INSIGHTS BY TYPE
  // ─────────────────────────────────────────
  const filteredInsights = activeFilter === 'all'
    ? insights
    : insights.filter((i) => i.type === activeFilter);

  // Count by type for filter badges
  const countByType = insights.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* ─────────────────────────────────────
          HEADER
          ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2>💡 Smart Insights</h2>
          <p className="text-gray-500 mt-1">
            AI-powered observations about your spending
          </p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="input w-auto text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input w-auto text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={fetchInsights}
            className="btn-secondary text-sm"
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────
          SUMMARY BANNER
          ───────────────────────────────────── */}
      {!loading && insights.length > 0 && (
        <div className="card mb-6 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium text-primary-700">
                {insights.length} insight{insights.length !== 1 ? 's' : ''} found for{' '}
                {MONTHS[selectedMonth - 1]} {selectedYear}
              </p>
              <p className="text-xs text-primary-500 mt-1">
                Based on your actual spending patterns
              </p>
            </div>
            <div className="flex gap-3">
              {countByType.danger && (
                <div className="text-center">
                  <p className="text-xl font-bold text-red-600">{countByType.danger}</p>
                  <p className="text-xs text-gray-500">Critical</p>
                </div>
              )}
              {countByType.warning && (
                <div className="text-center">
                  <p className="text-xl font-bold text-yellow-600">{countByType.warning}</p>
                  <p className="text-xs text-gray-500">Warnings</p>
                </div>
              )}
              {countByType.success && (
                <div className="text-center">
                  <p className="text-xl font-bold text-green-600">{countByType.success}</p>
                  <p className="text-xs text-gray-500">Good</p>
                </div>
              )}
              {countByType.info && (
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">{countByType.info}</p>
                  <p className="text-xs text-gray-500">Info</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────
          FILTER TABS
          ───────────────────────────────────── */}
      {!loading && insights.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTER_TYPES.map((filter) => {
            const count = filter.value === 'all'
              ? insights.length
              : (countByType[filter.value] || 0);

            if (count === 0 && filter.value !== 'all') return null;

            return (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${activeFilter === filter.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${activeFilter === filter.value
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'bg-gray-100 text-gray-500'
                  }
                `}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────
          CONTENT STATES
          ───────────────────────────────────── */}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex gap-4">
                <div className="w-11 h-11 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-48 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">❌</p>
          <p className="text-gray-600 font-medium">{error}</p>
          <button onClick={fetchInsights} className="btn-primary mt-4 text-sm">
            Try Again
          </button>
        </div>
      )}

      {/* No insights at all */}
      {!loading && !error && insights.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Insights Yet
          </h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Insights appear once you have enough spending data.
            Add at least 5 expenses across a few categories and
            check back!
          </p>
        </div>
      )}

      {/* No insights for current filter */}
      {!loading && !error && insights.length > 0 && filteredInsights.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-600 font-medium">
            No {activeFilter} insights this month
          </p>
          <button
            onClick={() => setActiveFilter('all')}
            className="text-primary-600 text-sm font-medium mt-2"
          >
            View all insights
          </button>
        </div>
      )}

      {/* Insights list */}
      {!loading && !error && filteredInsights.length > 0 && (
        <div className="space-y-4">
          {filteredInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {/* How insights work */}
      {!loading && (
        <div className="mt-8 card bg-gray-50 border border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            🤖 How Insights Work
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: '🏖️', text: 'Weekend vs weekday spending comparison' },
              { icon: '🔥', text: 'Budget burn rate projection' },
              { icon: '⚠️', text: 'Category budget overspend detection' },
              { icon: '🔄', text: 'Recurring expense identification' },
              { icon: '🏆', text: 'Biggest spending category analysis' },
              { icon: '📈', text: 'Week-over-week trend comparison' },
              { icon: '📅', text: 'Daily average + monthly projection' },
              { icon: '💡', text: 'Saving opportunity finder' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-xs text-gray-500">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default InsightsPage;