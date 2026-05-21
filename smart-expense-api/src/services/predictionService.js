// ═══════════════════════════════════════════════
// src/services/predictionService.js
//
// Spending prediction engine using:
// - Moving average (last 3 months)
// - Linear regression (trend detection)
// - Per-category predictions
// - Confidence scoring
// ═══════════════════════════════════════════════

const Expense = require('../models/Expense');
const Budget  = require('../models/Budget');
const mongoose = require('mongoose');

// ───────────────────────────────────────────────
// MAIN FUNCTION — generatePredictions
// Returns predictions for next month
// ───────────────────────────────────────────────
const generatePredictions = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const now          = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();

  // Next month calculation
  // Handle December → January year rollover
  const nextMonth = currentMonth === 12 ? 1  : currentMonth + 1;
  const nextYear  = currentMonth === 12 ? currentYear + 1 : currentYear;

  // ─────────────────────────────────────────
  // FETCH LAST 6 MONTHS OF DATA
  // More months = better prediction accuracy
  // We use 6 months of data but weight recent
  // months more heavily
  // ─────────────────────────────────────────
  const monthlyData = await fetchMonthlyData(userObjectId, currentMonth, currentYear, 6);

  // Need at least 2 months of data to predict
  if (monthlyData.filter((m) => m.total > 0).length < 2) {
    return {
      hasEnoughData: false,
      message: 'Add at least 2 months of expenses to see predictions',
      nextMonth,
      nextYear,
    };
  }

  // ─────────────────────────────────────────
  // OVERALL PREDICTION
  // ─────────────────────────────────────────
  const totals = monthlyData.map((m) => m.total);
  const overallPrediction = predict(totals);

  // ─────────────────────────────────────────
  // PER-CATEGORY PREDICTIONS
  // ─────────────────────────────────────────
  const allCategories = getAllCategories(monthlyData);
  const categoryPredictions = allCategories.map((category) => {
    const categoryTotals = monthlyData.map(
      (m) => m.categories[category] || 0
    );

    // Only predict if category has data in at least 2 months
    const nonZeroMonths = categoryTotals.filter((t) => t > 0).length;
    if (nonZeroMonths < 2) return null;

    const prediction = predict(categoryTotals);

    return {
      category,
      ...prediction,
    };
  }).filter(Boolean);

  // Sort by predicted amount descending
  categoryPredictions.sort((a, b) => b.predicted - a.predicted);

  // ─────────────────────────────────────────
  // COMPARE WITH BUDGET
  // ─────────────────────────────────────────
  const nextMonthBudget = await Budget.findOne({
    user: userId,
    month: nextMonth,
    year: nextYear,
  });

  // Use current month budget if next month not set
  const currentBudget = await Budget.findOne({
    user: userId,
    month: currentMonth,
    year: currentYear,
  });

  const activeBudget = nextMonthBudget || currentBudget;
  const monthlyLimit = activeBudget?.monthlyLimit || 0;

  const budgetComparison = monthlyLimit > 0 ? {
    limit: monthlyLimit,
    predicted: overallPrediction.predicted,
    difference: overallPrediction.predicted - monthlyLimit,
    willExceed: overallPrediction.predicted > monthlyLimit,
    percentOfBudget: Math.round(
      (overallPrediction.predicted / monthlyLimit) * 100
    ),
  } : null;

  // ─────────────────────────────────────────
  // BUILD CHART DATA — last 6 months + prediction
  // ─────────────────────────────────────────
  const MONTH_SHORT = [
    'Jan','Feb','Mar','Apr','May',
    'Jun','Jul','Aug','Sep','Oct','Nov','Dec'
  ];

  const trendChartData = [
    ...monthlyData.map((m) => ({
      label: `${MONTH_SHORT[m.month - 1]} ${m.year}`,
      shortLabel: MONTH_SHORT[m.month - 1],
      actual: m.total,
      predicted: null,
      isPrediction: false,
    })),
    {
      label: `${MONTH_SHORT[nextMonth - 1]} ${nextYear} (predicted)`,
      shortLabel: `${MONTH_SHORT[nextMonth - 1]}*`,
      actual: null,
      predicted: overallPrediction.predicted,
      isPrediction: true,
    },
  ];

  return {
    hasEnoughData: true,
    nextMonth,
    nextYear,
    overall: overallPrediction,
    categories: categoryPredictions,
    budgetComparison,
    trendChartData,
    monthlyData,
    generatedAt: new Date().toISOString(),
  };
};

// ───────────────────────────────────────────────
// fetchMonthlyData
// Fetches spending totals for last N months
// Returns array from oldest to newest
// ───────────────────────────────────────────────
const fetchMonthlyData = async (userObjectId, currentMonth, currentYear, numMonths) => {
  const months = [];

  for (let i = numMonths - 1; i >= 0; i--) {
    let month = currentMonth - i;
    let year  = currentYear;

    while (month <= 0) {
      month += 12;
      year  -= 1;
    }

    months.push({ month, year });
  }

  // Fetch all months in parallel
  const monthlyData = await Promise.all(
    months.map(async ({ month, year }) => {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 0, 23, 59, 59, 999);

      const result = await Expense.aggregate([
        {
          $match: {
            user: userObjectId,
            date: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
          },
        },
      ]);

      // Build categories map
      const categories = {};
      let total = 0;

      result.forEach(({ _id, total: amount }) => {
        categories[_id] = amount;
        total += amount;
      });

      return { month, year, total, categories };
    })
  );

  return monthlyData;
};

// ───────────────────────────────────────────────
// getAllCategories
// Extracts unique categories across all months
// ───────────────────────────────────────────────
const getAllCategories = (monthlyData) => {
  const categorySet = new Set();
  monthlyData.forEach((m) => {
    Object.keys(m.categories).forEach((cat) => categorySet.add(cat));
  });
  return [...categorySet];
};

// ───────────────────────────────────────────────
// predict — THE CORE ALGORITHM
//
// Takes array of values (oldest to newest)
// Returns prediction for next period
//
// Uses weighted combination of:
// 1. Linear regression (detects trend direction)
// 2. Moving average of last 3 months (stable baseline)
//
// @param {number[]} values - monthly totals oldest to newest
// @returns {object} prediction result
// ───────────────────────────────────────────────
const predict = (values) => {
  // Filter out leading zeros
  // (months with no spending at start of user's history)
  const nonZeroStart = values.findIndex((v) => v > 0);
  const cleanValues  = values.slice(nonZeroStart);

  if (cleanValues.length === 0) {
    return { predicted: 0, trend: 'neutral', confidence: 'low', changePercent: 0 };
  }

  if (cleanValues.length === 1) {
    return {
      predicted: Math.round(cleanValues[0]),
      trend: 'neutral',
      confidence: 'low',
      changePercent: 0,
    };
  }

  // ─────────────────────────────────────────
  // LINEAR REGRESSION
  // Finds the best-fit line through all data points
  // y = mx + b where:
  //   x = month index (0, 1, 2, ...)
  //   y = spending amount
  //   m = slope (rate of change per month)
  //   b = y-intercept
  // ─────────────────────────────────────────
  const n  = cleanValues.length;
  const xs = cleanValues.map((_, i) => i);       // [0, 1, 2, 3, ...]
  const ys = cleanValues;                         // actual values

  const sumX  = xs.reduce((a, b) => a + b, 0);
  const sumY  = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);

  // Slope (m) — how much spending changes each month
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Intercept (b)
  const intercept = (sumY - slope * sumX) / n;

  // Predict for next period (x = n)
  const regressionPrediction = intercept + slope * n;

  // ─────────────────────────────────────────
  // MOVING AVERAGE (last 3 months)
  // Simple average of recent months
  // Acts as a stable baseline
  // ─────────────────────────────────────────
  const recentValues = cleanValues.slice(-3);
  const movingAverage = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;

  // ─────────────────────────────────────────
  // WEIGHTED COMBINATION
  // If strong trend detected → lean on regression
  // If noisy data → lean on moving average
  //
  // Weight regression more when we have more data
  // ─────────────────────────────────────────
  const regressionWeight = Math.min(0.7, n * 0.1); // max 70%
  const movingAvgWeight  = 1 - regressionWeight;

  const rawPrediction =
    regressionPrediction * regressionWeight +
    movingAverage        * movingAvgWeight;

  // Never predict negative spending
  const predicted = Math.max(0, Math.round(rawPrediction));

  // ─────────────────────────────────────────
  // TREND DIRECTION
  // ─────────────────────────────────────────
  let trend;
  const slopePercent = movingAverage > 0
    ? (slope / movingAverage) * 100
    : 0;

  if (slopePercent > 5)       trend = 'increasing';
  else if (slopePercent < -5) trend = 'decreasing';
  else                         trend = 'stable';

  // ─────────────────────────────────────────
  // CONFIDENCE LEVEL
  // More months of data = higher confidence
  // ─────────────────────────────────────────
  let confidence;
  if (n >= 5)      confidence = 'high';
  else if (n >= 3) confidence = 'medium';
  else             confidence = 'low';

  // ─────────────────────────────────────────
  // CHANGE PERCENT vs LAST MONTH
  // ─────────────────────────────────────────
  const lastMonth   = cleanValues[cleanValues.length - 1];
  const changePercent = lastMonth > 0
    ? Math.round(((predicted - lastMonth) / lastMonth) * 100)
    : 0;

  return {
    predicted,
    trend,
    confidence,
    changePercent,
    movingAverage: Math.round(movingAverage),
    slope: Math.round(slope),
    dataPoints: n,
  };
};

module.exports = { generatePredictions };