// ═══════════════════════════════════════════════
// src/screens/dashboard/DashboardScreen.js
// ═══════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useAuth }         from '../../context/AuthContext';
import { getDashboardApi } from '../../api/analyticsApi';
import Card                from '../../components/common/Card';
import { COLORS, CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/constants';
import { formatDate }               from '../../utils/formatters';

const { width: SCREEN_W } = Dimensions.get('window');
// outer padding 16 + card padding 16 on each side = 64 total
const CHART_W = SCREEN_W - 64;

const LINE_CONFIG = {
  backgroundColor:       COLORS.white,
  backgroundGradientFrom: COLORS.white,
  backgroundGradientTo:  COLORS.white,
  decimalPlaces:         0,
  color:  (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  labelColor: ()        => COLORS.gray,
  propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
  propsForBackgroundLines: { stroke: COLORS.border, strokeDasharray: '' },
};

// Map long category names → short labels that fit pie legend
const PIE_LABEL = {
  'Food & Dining': 'Food',
  'Transportation': 'Transport',
  'Shopping': 'Shopping',
  'Entertainment': 'Entertain.',
  'Healthcare': 'Health',
  'Utilities': 'Utilities',
  'Education': 'Education',
  'Travel': 'Travel',
  'Personal Care': 'Personal',
  'Other': 'Other',
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── KPI Card ──
const KPICard = ({ title, value, subtitle, icon, valueColor }) => (
  <Card style={styles.kpiCard}>
    <View style={styles.kpiTop}>
      <Text style={styles.kpiLabel}>{title}</Text>
      <Text style={styles.kpiIcon}>{icon}</Text>
    </View>
    <Text style={[styles.kpiValue, { color: valueColor || COLORS.dark }]}>
      {value}
    </Text>
    {subtitle ? (
      <Text style={styles.kpiSub}>{subtitle}</Text>
    ) : null}
  </Card>
);

const DashboardScreen = ({ navigation }) => {
  const { user, fmt }       = useAuth();
  const now                 = new Date();
  const [month, setMonth]   = useState(now.getMonth() + 1);
  const [year,  setYear]    = useState(now.getFullYear());
  const [data,  setData]    = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]   = useState('');

  const fetchData = useCallback(async () => {
    setError('');
    try {
      const res = await getDashboardApi(month, year);
      setData(res.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Month navigation
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setLoading(true);
  };

  const nextMonth = () => {
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth() + 1) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setLoading(true);
  };

  const isCurrentMonth =
    month === now.getMonth() + 1 && year === now.getFullYear();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const { kpis, categoryBreakdown, recentExpenses, monthlyTrend } = data || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            👋 Hello, {user?.name?.split(' ')[0]}
          </Text>
          <Text style={styles.headerSub}>Financial Overview</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.gearBtn}>
          <Text style={styles.gearIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* ── MONTH SELECTOR ── */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {MONTH_NAMES[month - 1]} {year}
          {isCurrentMonth ? ' 🟢' : ''}
        </Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={[styles.monthArrow, isCurrentMonth && styles.disabledArrow]}
          disabled={isCurrentMonth}
        >
          <Text style={[styles.monthArrowText, isCurrentMonth && { color: COLORS.border }]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Card>
          <Text style={{ color: COLORS.danger, textAlign: 'center' }}>{error}</Text>
        </Card>
      ) : null}

      {/* ── KPI CARDS ── */}
      <View style={styles.kpiRow}>
        <KPICard
          title="Total Spent"
          value={fmt(kpis?.totalSpent || 0)}
          subtitle={`${kpis?.totalTransactions || 0} transactions`}
          icon="💸"
          valueColor={kpis?.isOverBudget ? COLORS.danger : COLORS.dark}
        />
        <KPICard
          title="Budget Left"
          value={
            kpis?.monthlyLimit > 0
              ? kpis.budgetLeft >= 0
                ? fmt(kpis.budgetLeft)
                : `-${fmt(Math.abs(kpis.budgetLeft))}`
              : '—'
          }
          subtitle={
            kpis?.monthlyLimit > 0
              ? `${kpis.budgetPercentage}% used`
              : 'No budget set'
          }
          icon="🎯"
          valueColor={
            !kpis?.monthlyLimit  ? COLORS.gray    :
            kpis?.isOverBudget   ? COLORS.danger  :
            kpis?.budgetPercentage >= 70 ? COLORS.warning :
            COLORS.success
          }
        />
      </View>

      {/* Budget progress bar */}
      {kpis?.monthlyLimit > 0 && (
        <Card style={styles.budgetCard}>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Budget Usage</Text>
            <Text style={[styles.budgetPct, {
              color: kpis.budgetPercentage >= 90 ? COLORS.danger :
                     kpis.budgetPercentage >= 70 ? COLORS.warning :
                     COLORS.success,
            }]}>
              {kpis.budgetPercentage}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill,
              {
                width: `${Math.min(kpis.budgetPercentage, 100)}%`,
                backgroundColor:
                  kpis.budgetPercentage >= 90 ? COLORS.danger  :
                  kpis.budgetPercentage >= 70 ? COLORS.warning :
                  COLORS.success,
              },
            ]} />
          </View>
          <View style={styles.budgetAmounts}>
            <Text style={styles.budgetAmount}>
              Spent: {fmt(kpis.totalSpent)}
            </Text>
            <Text style={styles.budgetAmount}>
              Budget: {fmt(kpis.monthlyLimit)}
            </Text>
          </View>
        </Card>
      )}

      {/* ── CATEGORY BREAKDOWN ── */}
      {categoryBreakdown?.length > 0 && (() => {
        const pieData = categoryBreakdown
          .slice(0, 6)
          .filter(cat => cat.totalAmount > 0)
          .map(cat => ({
            name:            PIE_LABEL[cat.category] || cat.category,
            population:      Math.round(cat.totalAmount),
            color:           CATEGORY_COLORS[cat.category] || COLORS.gray,
            legendFontColor: COLORS.gray,
            legendFontSize:  10,
          }));

        return (
          <Card>
            <Text style={styles.sectionTitle}>📂 Spending by Category</Text>

            {/* Pie chart — visual overview */}
            {pieData.length > 0 && (
              <PieChart
                data={pieData}
                width={CHART_W}
                height={180}
                chartConfig={LINE_CONFIG}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="8"
                hasLegend
                style={styles.chartStyle}
              />
            )}

            {/* Horizontal bars — detailed breakdown */}
            <View style={styles.categoryDivider} />
            {categoryBreakdown.slice(0, 5).map((cat) => {
              const pct   = kpis?.totalSpent > 0
                ? Math.round((cat.totalAmount / kpis.totalSpent) * 100)
                : 0;
              const color = CATEGORY_COLORS[cat.category] || COLORS.gray;
              const icon  = CATEGORY_ICONS[cat.category]  || '📦';
              return (
                <View key={cat.category} style={styles.categoryRow}>
                  <Text style={styles.categoryIcon}>{icon}</Text>
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryNameRow}>
                      <Text style={styles.categoryName}>{cat.category}</Text>
                      <Text style={styles.categoryAmount}>
                        {fmt(cat.totalAmount)}
                      </Text>
                    </View>
                    <View style={styles.categoryTrack}>
                      <View style={[
                        styles.categoryFill,
                        { width: `${pct}%`, backgroundColor: color },
                      ]} />
                    </View>
                    <Text style={styles.categoryPct}>{pct}% · {cat.count} txn</Text>
                  </View>
                </View>
              );
            })}
          </Card>
        );
      })()}

      {/* ── 6-MONTH TREND — LINE CHART ── */}
      {monthlyTrend?.length > 0 && monthlyTrend.some(m => m.amount > 0) && (
        <Card>
          <Text style={styles.sectionTitle}>📈 6-Month Trend</Text>
          <LineChart
            data={{
              labels: monthlyTrend.map(m => m.shortLabel),
              datasets: [{
                data:        monthlyTrend.map(m => Math.max(m.amount || 0, 0.01)),
                color:       (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                strokeWidth: 2.5,
              }],
            }}
            width={CHART_W}
            height={190}
            chartConfig={LINE_CONFIG}
            bezier
            withShadow={false}
            withInnerLines
            withOuterLines={false}
            style={styles.chartStyle}
            formatYLabel={(val) => {
              const n = parseFloat(val);
              return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(Math.round(n));
            }}
          />
        </Card>
      )}

      {/* ── RECENT TRANSACTIONS ── */}
      {recentExpenses?.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>🕐 Recent Transactions</Text>
          {recentExpenses.map((expense) => {
            const color = CATEGORY_COLORS[expense.category] || COLORS.gray;
            const icon  = CATEGORY_ICONS[expense.category]  || '📦';

            return (
              <View key={expense._id} style={styles.txnRow}>
                <View style={[styles.txnIcon, { backgroundColor: `${color}20` }]}>
                  <Text style={{ fontSize: 18 }}>{icon}</Text>
                </View>
                <View style={styles.txnInfo}>
                  <Text style={styles.txnDesc} numberOfLines={1}>
                    {expense.description}
                  </Text>
                  <Text style={styles.txnDate}>
                    {formatDate(expense.date)} · {expense.category}
                  </Text>
                </View>
                <Text style={styles.txnAmount}>
                  {fmt(expense.amount)}
                </Text>
              </View>
            );
          })}
        </Card>
      )}

      {/* Empty state */}
      {!kpis?.totalTransactions && !error && (
        <Card>
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={styles.emptyText}>No expenses this month</Text>
            <Text style={styles.emptySub}>
              Add expenses from the Expenses tab
            </Text>
          </View>
        </Card>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  content:     { padding: 16, paddingBottom: 32 },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: COLORS.gray, fontSize: 14 },

  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   20,
    paddingTop:     8,
  },
  greeting:   { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  headerSub:  { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  gearBtn:  { padding: 8 },
  gearIcon: { fontSize: 22 },

  monthSelector: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: COLORS.white,
    borderRadius:    12,
    padding:         12,
    marginBottom:    16,
    elevation:       2,
  },
  monthArrow:     { padding: 8 },
  disabledArrow:  { opacity: 0.3 },
  monthArrowText: { fontSize: 24, color: COLORS.primary, fontWeight: '700' },
  monthText:      { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginHorizontal: 20 },

  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  kpiCard: { flex: 1, marginBottom: 12 },
  kpiTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  kpiLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  kpiIcon:  { fontSize: 20 },
  kpiValue: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  kpiSub:   { fontSize: 11, color: COLORS.gray },

  budgetCard:   { marginBottom: 12 },
  budgetRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  budgetLabel:  { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  budgetPct:    { fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 8, backgroundColor: COLORS.lightGray, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill:  { height: 8, borderRadius: 4 },
  budgetAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetAmount:  { fontSize: 11, color: COLORS.gray },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 14 },

  categoryRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  categoryIcon:   { fontSize: 22, marginRight: 10, width: 32, textAlign: 'center' },
  categoryInfo:   { flex: 1 },
  categoryNameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  categoryName:   { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  categoryAmount: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  categoryTrack:  { height: 4, backgroundColor: COLORS.lightGray, borderRadius: 2, overflow: 'hidden', marginBottom: 3 },
  categoryFill:   { height: 4, borderRadius: 2 },
  categoryPct:    { fontSize: 10, color: COLORS.gray },

  chartStyle:      { borderRadius: 8, marginTop: 4, marginLeft: -4 },
  categoryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },

  txnRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  txnIcon:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txnInfo:  { flex: 1 },
  txnDesc:  { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  txnDate:  { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  txnAmount: { fontSize: 14, fontWeight: '700', color: COLORS.dark },

  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText:  { fontSize: 16, fontWeight: '600', color: COLORS.dark, marginTop: 12 },
  emptySub:   { fontSize: 13, color: COLORS.gray, marginTop: 6 },
});

export default DashboardScreen;