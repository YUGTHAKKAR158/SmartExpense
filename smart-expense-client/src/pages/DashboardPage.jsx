// ═══════════════════════════════════════════════
// src/pages/DashboardPage.jsx — Full Analytics Dashboard
// ═══════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardApi } from '../api/analyticsApi';
import KPICard from '../components/dashboard/KPICard';
import CategoryPieChart from '../components/dashboard/CategoryPieChart';
import DailyBarChart from '../components/dashboard/DailyBarChart';
import MonthlyLineChart from '../components/dashboard/MonthlyLineChart';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../utils/constants';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const DashboardPage = () => {
  const { user } = useAuth();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // ─────────────────────────────────────────
  // FETCH DASHBOARD DATA
  // ─────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getDashboardApi(selectedMonth, selectedYear);
      setDashData(response.data);
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isCurrentMonth =
    selectedMonth === currentMonth && selectedYear === currentYear;

  const yearOptions = [currentYear - 1, currentYear];

  // ─────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h2>📊 Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse h-64" />
          ))}
        </div>
      </div>
    );
  }

  const { kpis, categoryBreakdown, dailyBreakdown, recentExpenses, monthlyTrend } = dashData || {};

  return (
    <div>
      {/* ─────────────────────────────────────
          HEADER
          ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2>👋 Welcome back, {user?.name}</h2>
          <p className="text-gray-500 mt-1">
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear} Overview
            {isCurrentMonth && (
              <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                Current Month
              </span>
            )}
          </p>
        </div>

        {/* Month/Year selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="input w-auto text-sm"
          >
            {MONTH_NAMES.map((m, i) => (
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
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ─────────────────────────────────────
          KPI CARDS
          ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Total Spent */}
        <KPICard
          title="Total Spent"
          value={formatCurrency(kpis?.totalSpent || 0)}
          subtitle={`${kpis?.totalTransactions || 0} transactions this month`}
          icon="💸"
          valueColor={
            kpis?.isOverBudget ? 'text-red-600' : 'text-gray-900'
          }
        />

        {/* Budget Left */}
        <KPICard
          title="Budget Left"
          value={
            kpis?.monthlyLimit > 0
              ? kpis.budgetLeft >= 0
                ? formatCurrency(kpis.budgetLeft)
                : `-${formatCurrency(Math.abs(kpis.budgetLeft))}`
              : '—'
          }
          subtitle={
            kpis?.monthlyLimit > 0
              ? `${kpis.budgetPercentage}% of ${formatCurrency(kpis.monthlyLimit)} used`
              : 'No budget set'
          }
          icon="🎯"
          valueColor={
            !kpis?.monthlyLimit ? 'text-gray-400' :
            kpis?.isOverBudget ? 'text-red-600' :
            kpis?.budgetPercentage >= 70 ? 'text-yellow-600' :
            'text-green-600'
          }
        >
          {kpis?.monthlyLimit > 0 && (
            <div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${
                    kpis.budgetPercentage >= 90 ? 'bg-red-500' :
                    kpis.budgetPercentage >= 70 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${kpis.budgetPercentage}%` }}
                />
              </div>
            </div>
          )}
        </KPICard>

        {/* Top Category */}
        <KPICard
          title="Top Category"
          value={
            categoryBreakdown?.[0]?.category || '—'
          }
          subtitle={
            categoryBreakdown?.[0]
              ? `${formatCurrency(categoryBreakdown[0].totalAmount)} spent`
              : 'No expenses yet'
          }
          icon={
            categoryBreakdown?.[0]
              ? CATEGORY_ICONS[categoryBreakdown[0].category] || '📦'
              : '📦'
          }
        />

      </div>

      {/* ─────────────────────────────────────
          CHARTS ROW 1 — Pie + Bar
          ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Pie Chart */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            🥧 Spending by Category
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Where your money went this month
          </p>
          <CategoryPieChart data={categoryBreakdown} />
        </div>

        {/* Bar Chart */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            📊 Daily Spending
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Your spending pattern day by day
          </p>
          <DailyBarChart data={dailyBreakdown} />
        </div>

      </div>

      {/* ─────────────────────────────────────
          CHARTS ROW 2 — Line + Recent
          ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Line Chart */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            📈 6-Month Trend
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Your spending over the last 6 months
          </p>
          <MonthlyLineChart data={monthlyTrend} />

          {/* Trend summary */}
          {monthlyTrend && monthlyTrend.length >= 2 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              {(() => {
                const last = monthlyTrend[monthlyTrend.length - 1].amount;
                const prev = monthlyTrend[monthlyTrend.length - 2].amount;
                const diff = last - prev;
                const pct = prev > 0 ? Math.round((diff / prev) * 100) : 0;
                const isUp = diff > 0;
                return (
                  <p className="text-xs text-gray-500 text-center">
                    {isUp ? '📈' : '📉'} Spending is{' '}
                    <span className={`font-semibold ${isUp ? 'text-red-500' : 'text-green-500'}`}>
                      {isUp ? '+' : ''}{pct}%
                    </span>
                    {' '}vs last month
                  </p>
                );
              })()}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                🕐 Recent Transactions
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Latest 5 expenses this month
              </p>
            </div>
            <Link
              to="/expenses"
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              View all →
            </Link>
          </div>

          {recentExpenses && recentExpenses.length > 0 ? (
            <div className="space-y-1">
              {recentExpenses.map((expense) => {
                const color = CATEGORY_COLORS[expense.category] || '#6b7280';
                const icon = CATEGORY_ICONS[expense.category] || '📦';
                return (
                  <div
                    key={expense._id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <span className="text-base">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {expense.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(expense.date)}
                        {expense.merchant ? ` · ${expense.merchant}` : ''}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-gray-400 text-sm">No expenses this month</p>
              <Link
                to="/expenses"
                className="text-xs text-primary-600 font-medium mt-2 inline-block"
              >
                Add your first expense →
              </Link>
            </div>
          )}

          {/* Category breakdown mini list */}
          {categoryBreakdown && categoryBreakdown.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-3">
                By Category
              </p>
              <div className="space-y-2">
                {categoryBreakdown.slice(0, 4).map((cat) => {
                  const color = CATEGORY_COLORS[cat.category] || '#6b7280';
                  const pct = kpis?.totalSpent > 0
                    ? Math.round((cat.totalAmount / kpis.totalSpent) * 100)
                    : 0;
                  return (
                    <div key={cat.category} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-28 truncate flex-shrink-0">
                        {cat.category}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-16 text-right flex-shrink-0">
                        {formatCurrency(cat.totalAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default DashboardPage;