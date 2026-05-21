// ═══════════════════════════════════════════════
// src/services/insightsService.js
//
// Rule-based insights engine.
// Each function analyzes a specific pattern and
// returns an insight object or null (if no insight).
//
// Insight object shape:
// {
//   id: 'unique_id',
//   type: 'warning' | 'info' | 'success' | 'danger',
//   title: 'Short headline',
//   message: 'Detailed explanation',
//   value: 'Key number to highlight',
//   category: 'optional — which category this is about',
//   priority: 1-5 (1 = highest, shown first)
// }
// ═══════════════════════════════════════════════

const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const mongoose = require('mongoose');

// ───────────────────────────────────────────────
// MAIN FUNCTION — generateInsights
// Runs all 8 analyzers and returns sorted results
// ───────────────────────────────────────────────
const generateInsights = async (userId, month, year) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth   = new Date(year, month, 0, 23, 59, 59, 999);

  // Fetch all data needed by all analyzers in ONE query batch
  // This is more efficient than each analyzer fetching separately
  const [expenses, budget] = await Promise.all([
    Expense.find({
      user: userObjectId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ date: 1 }),

    Budget.findOne({ user: userId, month, year }),
  ]);

  // Also fetch last 3 months for trend-based insights
  const threeMonthsAgo = new Date(year, month - 4, 1);
  const previousExpenses = await Expense.find({
    user: userObjectId,
    date: { $gte: threeMonthsAgo, $lt: startOfMonth },
  });

  // Run all analyzers — each returns an insight or null
  const insightResults = await Promise.all([
    analyzeWeekendSpending(expenses),
    analyzeBudgetBurnRate(expenses, budget, month, year),
    analyzeCategoryOverspend(expenses, budget),
    analyzeRecurringExpenses(expenses, previousExpenses),
    analyzeBiggestCategory(expenses),
    analyzeWeekOverWeek(expenses),
    analyzeDailyAverage(expenses, month, year),
    analyzeSavingOpportunity(expenses, previousExpenses),
  ]);

  // Filter out nulls (analyzers that found nothing notable)
  // and sort by priority (1 = most important first)
  const insights = insightResults
    .filter(Boolean)
    .sort((a, b) => a.priority - b.priority);

  return insights;
};

// ═══════════════════════════════════════════════
// ANALYZER 1 — Weekend Spending Spike
// Detects if you spend significantly more on
// weekends vs weekdays
// ═══════════════════════════════════════════════
const analyzeWeekendSpending = (expenses) => {
  if (expenses.length < 5) return null;

  let weekdayTotal = 0;
  let weekendTotal = 0;
  let weekdayCount = 0;
  let weekendCount = 0;

  expenses.forEach((expense) => {
    const dayOfWeek = new Date(expense.date).getDay();
    // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      weekendTotal += expense.amount;
      weekendCount++;
    } else {
      weekdayTotal += expense.amount;
      weekdayCount++;
    }
  });

  if (weekendCount === 0 || weekdayCount === 0) return null;

  // Calculate average daily spending
  const avgWeekday = weekdayTotal / weekdayCount;
  const avgWeekend = weekendTotal / weekendCount;

  // Only surface this insight if weekend spending is
  // significantly higher (more than 40% more per transaction)
  const spikePct = Math.round(((avgWeekend - avgWeekday) / avgWeekday) * 100);

  if (spikePct < 40) return null;

  return {
    id: 'weekend_spike',
    type: 'warning',
    title: 'Weekend Spending Spike',
    message: `You spend ${spikePct}% more per transaction on weekends compared to weekdays. Weekend average: ₹${Math.round(avgWeekend)}, Weekday average: ₹${Math.round(avgWeekday)}.`,
    value: `+${spikePct}% on weekends`,
    priority: 2,
    icon: '🏖️',
  };
};

// ═══════════════════════════════════════════════
// ANALYZER 2 — Budget Burn Rate
// At current spending rate, will you exceed budget?
// ═══════════════════════════════════════════════
const analyzeBudgetBurnRate = (expenses, budget, month, year) => {
  if (!budget || !budget.monthlyLimit || budget.monthlyLimit === 0) return null;
  if (expenses.length === 0) return null;

  const today = new Date();
  const isCurrentMonth =
    month === today.getMonth() + 1 && year === today.getFullYear();

  if (!isCurrentMonth) return null;

  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysRemaining = daysInMonth - dayOfMonth;

  if (dayOfMonth < 5) return null; // Too early in month to predict

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const dailyRate = totalSpent / dayOfMonth;
  const projectedTotal = dailyRate * daysInMonth;
  const projectedOverspend = projectedTotal - budget.monthlyLimit;
  const burnPct = Math.round((totalSpent / budget.monthlyLimit) * 100);

  // Only warn if projected to exceed budget
  if (projectedTotal <= budget.monthlyLimit) {
    // Good news insight — on track
    if (burnPct < 50 && dayOfMonth > 15) {
      return {
        id: 'burn_rate_good',
        type: 'success',
        title: 'Great Budget Control!',
        message: `You're halfway through the month and have only used ${burnPct}% of your budget. At this rate you'll stay well within your limit.`,
        value: `${100 - burnPct}% budget remaining`,
        priority: 4,
        icon: '✅',
      };
    }
    return null;
  }

  return {
    id: 'burn_rate_warning',
    type: projectedOverspend > budget.monthlyLimit * 0.2 ? 'danger' : 'warning',
    title: 'Budget Burn Rate Alert',
    message: `At your current spending rate of ₹${Math.round(dailyRate)}/day, you're projected to spend ₹${Math.round(projectedTotal)} this month — ₹${Math.round(projectedOverspend)} over your ₹${budget.monthlyLimit} budget.`,
    value: `Projected: ₹${Math.round(projectedTotal)}`,
    priority: 1,
    icon: '🔥',
  };
};

// ═══════════════════════════════════════════════
// ANALYZER 3 — Category Overspend
// Which categories are closest to their limits?
// ═══════════════════════════════════════════════
const analyzeCategoryOverspend = (expenses, budget) => {
  if (!budget || !budget.categoryBudgets || budget.categoryBudgets.length === 0) {
    return null;
  }

  // Calculate spending per category
  const spendingByCategory = {};
  expenses.forEach((expense) => {
    spendingByCategory[expense.category] =
      (spendingByCategory[expense.category] || 0) + expense.amount;
  });

  // Find the most critical category (highest % used)
  let worstCategory = null;
  let worstPct = 0;

  budget.categoryBudgets.forEach(({ category, limit }) => {
    const spent = spendingByCategory[category] || 0;
    const pct = Math.round((spent / limit) * 100);

    if (pct > worstPct) {
      worstPct = pct;
      worstCategory = { category, spent, limit, pct };
    }
  });

  if (!worstCategory || worstPct < 70) return null;

  const isExceeded = worstPct >= 100;

  return {
    id: 'category_overspend',
    type: isExceeded ? 'danger' : 'warning',
    title: isExceeded
      ? `${worstCategory.category} Budget Exceeded!`
      : `${worstCategory.category} Budget at ${worstPct}%`,
    message: isExceeded
      ? `You've exceeded your ${worstCategory.category} budget. Spent ₹${Math.round(worstCategory.spent)} against a limit of ₹${worstCategory.limit}.`
      : `You've used ${worstPct}% of your ${worstCategory.category} budget. ₹${Math.round(worstCategory.limit - worstCategory.spent)} remaining.`,
    value: `${worstPct}% used`,
    category: worstCategory.category,
    priority: isExceeded ? 1 : 2,
    icon: isExceeded ? '🚨' : '⚠️',
  };
};

// ═══════════════════════════════════════════════
// ANALYZER 4 — Recurring Expense Detector
// Finds merchants that appear every month
// (possible subscriptions)
// ═══════════════════════════════════════════════
const analyzeRecurringExpenses = (currentExpenses, previousExpenses) => {
  if (previousExpenses.length === 0) return null;

  // Get merchants from current month
  const currentMerchants = new Set(
    currentExpenses
      .filter((e) => e.merchant && e.merchant.trim() !== '')
      .map((e) => e.merchant.toLowerCase().trim())
  );

  // Get merchants from previous months
  const previousMerchants = new Set(
    previousExpenses
      .filter((e) => e.merchant && e.merchant.trim() !== '')
      .map((e) => e.merchant.toLowerCase().trim())
  );

  // Find merchants that appear in BOTH current and previous
  const recurring = [...currentMerchants].filter((m) =>
    previousMerchants.has(m)
  );

  if (recurring.length === 0) return null;

  // Calculate total amount for recurring merchants this month
  const recurringTotal = currentExpenses
    .filter((e) =>
      e.merchant &&
      recurring.includes(e.merchant.toLowerCase().trim())
    )
    .reduce((sum, e) => sum + e.amount, 0);

  // Capitalize merchant names for display
  const merchantList = recurring
    .slice(0, 3)
    .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
    .join(', ');

  return {
    id: 'recurring_expenses',
    type: 'info',
    title: `${recurring.length} Recurring Expense${recurring.length > 1 ? 's' : ''} Detected`,
    message: `These merchants appear every month: ${merchantList}${recurring.length > 3 ? ` and ${recurring.length - 3} more` : ''}. Total recurring spend this month: ₹${Math.round(recurringTotal)}.`,
    value: `₹${Math.round(recurringTotal)}/month`,
    priority: 3,
    icon: '🔄',
  };
};

// ═══════════════════════════════════════════════
// ANALYZER 5 — Biggest Expense Category
// Simple but useful — what's eating most of your budget
// ═══════════════════════════════════════════════
const analyzeBiggestCategory = (expenses) => {
  if (expenses.length < 3) return null;

  const categoryTotals = {};
  const totalSpent = expenses.reduce((sum, e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    return sum + e.amount;
  }, 0);

  if (totalSpent === 0) return null;

  // Find the top category
  const topCategory = Object.entries(categoryTotals).sort(
    ([, a], [, b]) => b - a
  )[0];

  const [category, amount] = topCategory;
  const pct = Math.round((amount / totalSpent) * 100);

  // Only surface if one category dominates (more than 35%)
  if (pct < 35) return null;

  return {
    id: 'biggest_category',
    type: pct > 60 ? 'warning' : 'info',
    title: `${category} is Your Biggest Expense`,
    message: `${category} accounts for ${pct}% of your total spending this month (₹${Math.round(amount)} out of ₹${Math.round(totalSpent)} total).`,
    value: `${pct}% of spending`,
    category,
    priority: 3,
    icon: '🏆',
  };
};

// ═══════════════════════════════════════════════
// ANALYZER 6 — Week Over Week Comparison
// Is spending increasing or decreasing this month?
// ═══════════════════════════════════════════════
const analyzeWeekOverWeek = (expenses) => {
  if (expenses.length < 4) return null;

  const today = new Date();
  const dayOfMonth = today.getDate();

  // Need at least 2 weeks of data
  if (dayOfMonth < 14) return null;

  // Split expenses into last 7 days vs previous 7 days
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);

  const lastWeekTotal = expenses
    .filter((e) => new Date(e.date) >= oneWeekAgo)
    .reduce((sum, e) => sum + e.amount, 0);

  const prevWeekTotal = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d >= twoWeeksAgo && d < oneWeekAgo;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  if (prevWeekTotal === 0) return null;

  const changePct = Math.round(
    ((lastWeekTotal - prevWeekTotal) / prevWeekTotal) * 100
  );

  // Only surface if there's a significant change (more than 20%)
  if (Math.abs(changePct) < 20) return null;

  const isIncrease = changePct > 0;

  return {
    id: 'week_over_week',
    type: isIncrease ? 'warning' : 'success',
    title: isIncrease
      ? `Spending Up ${changePct}% This Week`
      : `Spending Down ${Math.abs(changePct)}% This Week`,
    message: isIncrease
      ? `You spent ₹${Math.round(lastWeekTotal)} this week vs ₹${Math.round(prevWeekTotal)} last week. Your spending is trending upward.`
      : `Great job! You spent ₹${Math.round(lastWeekTotal)} this week vs ₹${Math.round(prevWeekTotal)} last week. Your spending is trending down.`,
    value: `${isIncrease ? '+' : ''}${changePct}% vs last week`,
    priority: isIncrease ? 2 : 4,
    icon: isIncrease ? '📈' : '📉',
  };
};

// ═══════════════════════════════════════════════
// ANALYZER 7 — Daily Average Calculator
// What's your daily spending rate this month?
// ═══════════════════════════════════════════════
const analyzeDailyAverage = (expenses, month, year) => {
  if (expenses.length === 0) return null;

  const today = new Date();
  const isCurrentMonth =
    month === today.getMonth() + 1 && year === today.getFullYear();

  const daysElapsed = isCurrentMonth
    ? today.getDate()
    : new Date(year, month, 0).getDate();

  if (daysElapsed === 0) return null;

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const dailyAvg = totalSpent / daysElapsed;

  // Project monthly total
  const daysInMonth = new Date(year, month, 0).getDate();
  const projectedMonthly = dailyAvg * daysInMonth;

  return {
    id: 'daily_average',
    type: 'info',
    title: 'Daily Spending Average',
    message: `You're spending an average of ₹${Math.round(dailyAvg)} per day this month. At this rate, your monthly total will be approximately ₹${Math.round(projectedMonthly)}.`,
    value: `₹${Math.round(dailyAvg)}/day`,
    priority: 4,
    icon: '📅',
  };
};

// ═══════════════════════════════════════════════
// ANALYZER 8 — Saving Opportunity
// Compares current month to average of last 3 months
// and suggests where you could cut back
// ═══════════════════════════════════════════════
const analyzeSavingOpportunity = (currentExpenses, previousExpenses) => {
  if (previousExpenses.length === 0 || currentExpenses.length === 0) return null;

  // Calculate category totals for current month
  const currentByCategory = {};
  currentExpenses.forEach((e) => {
    currentByCategory[e.category] =
      (currentByCategory[e.category] || 0) + e.amount;
  });

  // Calculate category totals for previous months
  const previousByCategory = {};
  previousExpenses.forEach((e) => {
    previousByCategory[e.category] =
      (previousByCategory[e.category] || 0) + e.amount;
  });

  // Find category with biggest increase vs previous period
  let biggestIncrease = null;
  let biggestIncreasePct = 0;

  Object.entries(currentByCategory).forEach(([category, currentAmount]) => {
    const prevAmount = previousByCategory[category] || 0;
    if (prevAmount === 0) return;

    // Normalize: previous covers 3 months, current covers 1 month
    // So compare current vs (previous / 3) for fair comparison
    const prevMonthlyAvg = prevAmount / 3;
    const increasePct = Math.round(
      ((currentAmount - prevMonthlyAvg) / prevMonthlyAvg) * 100
    );

    if (increasePct > biggestIncreasePct && currentAmount > 500) {
      biggestIncreasePct = increasePct;
      biggestIncrease = {
        category,
        currentAmount,
        prevMonthlyAvg,
        increasePct,
      };
    }
  });

  if (!biggestIncrease || biggestIncreasePct < 30) return null;

  const potentialSaving = Math.round(
    biggestIncrease.currentAmount - biggestIncrease.prevMonthlyAvg
  );

  return {
    id: 'saving_opportunity',
    type: 'warning',
    title: `${biggestIncrease.category} Spending Jumped ${biggestIncreasePct}%`,
    message: `Your ${biggestIncrease.category} spending is ₹${Math.round(biggestIncrease.currentAmount)} this month vs your 3-month average of ₹${Math.round(biggestIncrease.prevMonthlyAvg)}. Cutting back could save you ₹${potentialSaving} this month.`,
    value: `Save up to ₹${potentialSaving}`,
    category: biggestIncrease.category,
    priority: 2,
    icon: '💡',
  };
};

module.exports = { generateInsights };