// ═══════════════════════════════════════════════
// src/services/analyticsService.js
//
// All data aggregations for the dashboard charts.
// Every function runs a MongoDB aggregation pipeline
// and returns clean data ready for Recharts.
// ═══════════════════════════════════════════════

const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const mongoose = require('mongoose');

// ───────────────────────────────────────────────
// getMonthlyOverview
// Returns everything needed for the dashboard:
// - KPI numbers (total spent, budget left, count)
// - Spending by category (for pie chart)
// - Daily spending this month (for bar chart)
// - Last 6 months totals (for line chart)
// - Recent 5 transactions
// ───────────────────────────────────────────────
const getMonthlyOverview = async (userId, month, year) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Date range for current month
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  // Run ALL aggregations in parallel for maximum speed
  // Promise.all waits for ALL of them to finish
  const [
    categoryData,
    dailyData,
    recentExpenses,
    monthlyTrend,
    budget,
  ] = await Promise.all([
    getCategoryBreakdown(userObjectId, startOfMonth, endOfMonth),
    getDailyBreakdown(userObjectId, startOfMonth, endOfMonth, month, year),
    getRecentTransactions(userObjectId, startOfMonth, endOfMonth),
    getMonthlyTrend(userObjectId, month, year),
    Budget.findOne({ user: userId, month, year }),
  ]);

  // Calculate totals from category data
  const totalSpent = categoryData.reduce(
    (sum, cat) => sum + cat.totalAmount, 0
  );
  const totalTransactions = categoryData.reduce(
    (sum, cat) => sum + cat.count, 0
  );

  // Budget calculations
  const monthlyLimit = budget?.monthlyLimit || 0;
  const budgetLeft = monthlyLimit > 0 ? monthlyLimit - totalSpent : null;
  const budgetPercentage = monthlyLimit > 0
    ? Math.min(Math.round((totalSpent / monthlyLimit) * 100), 100)
    : 0;

  return {
    kpis: {
      totalSpent,
      totalTransactions,
      monthlyLimit,
      budgetLeft,
      budgetPercentage,
      isOverBudget: monthlyLimit > 0 && totalSpent > monthlyLimit,
    },
    categoryBreakdown: categoryData,
    dailyBreakdown: dailyData,
    recentExpenses,
    monthlyTrend,
    month,
    year,
  };
};

// ───────────────────────────────────────────────
// getCategoryBreakdown — for PIE CHART
// Groups expenses by category with totals
// ───────────────────────────────────────────────
const getCategoryBreakdown = async (userObjectId, startDate, endDate) => {
  return await Expense.aggregate([
    {
      $match: {
        user: userObjectId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
    {
      $project: {
        _id: 0,
        category: '$_id',
        totalAmount: 1,
        count: 1,
      },
    },
  ]);
};

// ───────────────────────────────────────────────
// getDailyBreakdown — for BAR CHART
// Returns spending for every day of the month
// Days with no spending get a 0 value
// ───────────────────────────────────────────────
const getDailyBreakdown = async (
  userObjectId, startDate, endDate, month, year
) => {
  // Get days that have spending
  const dailyExpenses = await Expense.aggregate([
    {
      $match: {
        user: userObjectId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dayOfMonth: '$date' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id': 1 } },
  ]);

  // Build a map of day → amount
  const dailyMap = {};
  dailyExpenses.forEach(({ _id, totalAmount }) => {
    dailyMap[_id] = totalAmount;
  });

  // Generate array for ALL days in the month
  // Days without spending get amount: 0
  // This ensures the bar chart shows the full month
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date().getDate();
  const isCurrentMonth =
    month === new Date().getMonth() + 1 &&
    year === new Date().getFullYear();

  const allDays = [];
  // Only show days up to today for current month
  const lastDay = isCurrentMonth ? today : daysInMonth;

  for (let day = 1; day <= lastDay; day++) {
    allDays.push({
      day,
      // Short label for x-axis: "1", "5", "10" etc
      label: day.toString(),
      amount: dailyMap[day] || 0,
    });
  }

  return allDays;
};

// ───────────────────────────────────────────────
// getRecentTransactions — for RECENT LIST
// Last 5 expenses for the month
// ───────────────────────────────────────────────
const getRecentTransactions = async (userObjectId, startDate, endDate) => {
  return await Expense.find({
    user: userObjectId,
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: -1 })
    .limit(5)
    .select('description amount category date paymentMethod merchant');
};

// ───────────────────────────────────────────────
// getMonthlyTrend — for LINE CHART
// Returns total spending for last 6 months
// ───────────────────────────────────────────────
const getMonthlyTrend = async (userObjectId, currentMonth, currentYear) => {
  // Build array of last 6 months (including current)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    let month = currentMonth - i;
    let year = currentYear;

    // Handle going back to previous year
    if (month <= 0) {
      month += 12;
      year -= 1;
    }

    months.push({ month, year });
  }

  // Fetch spending for each month
  const monthlyData = await Promise.all(
    months.map(async ({ month, year }) => {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      const result = await Expense.aggregate([
        {
          $match: {
            user: userObjectId,
            date: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]);

      const MONTH_SHORT = [
        'Jan','Feb','Mar','Apr','May','Jun',
        'Jul','Aug','Sep','Oct','Nov','Dec'
      ];

      return {
        month,
        year,
        label: `${MONTH_SHORT[month - 1]} ${year}`,
        shortLabel: MONTH_SHORT[month - 1],
        amount: result[0]?.total || 0,
        count: result[0]?.count || 0,
      };
    })
  );

  return monthlyData;
};

module.exports = { getMonthlyOverview };