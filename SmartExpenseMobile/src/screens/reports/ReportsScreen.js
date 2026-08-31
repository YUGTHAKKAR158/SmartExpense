// ═══════════════════════════════════════════════
// src/screens/reports/ReportsScreen.js
// View-only report summary (no download on mobile)
// ═══════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { getReportSummaryApi } from '../../api/reportApi';
import Card from '../../components/common/Card';
import { COLORS, CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const ReportsScreen = () => {
  const { fmt } = useAuth();
  const now = new Date();
  const [month,      setMonth]      = useState(now.getMonth() + 1);
  const [year,       setYear]       = useState(now.getFullYear());
  const [reportData, setReportData] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReportSummaryApi(month, year);
      setReportData(res.data);
    } catch (err) {
      console.log('Report fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month, year]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const { summary, categoryBreakdown, paymentMethodData } = reportData || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchReport(); }}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📄 Reports</Text>
      </View>

      {/* Month selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => {
          setLoading(true);
          if (month === 1) { setMonth(12); setYear(y => y - 1); }
          else setMonth(m => m - 1);
        }}>
          <Text style={styles.monthArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {MONTHS[month - 1]} {year}
          {isCurrentMonth ? ' 🟢' : ''}
        </Text>
        <TouchableOpacity onPress={() => {
          if (isCurrentMonth) return;
          setLoading(true);
          if (month === 12) { setMonth(1); setYear(y => y + 1); }
          else setMonth(m => m + 1);
        }}>
          <Text style={[styles.monthArrow, isCurrentMonth && { color: COLORS.border }]}>›</Text>
        </TouchableOpacity>
      </View>

      {!summary?.totalTransactions ? (
        <Card>
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={styles.emptyText}>No data for this month</Text>
            <Text style={styles.emptySub}>Add expenses to see your report</Text>
          </View>
        </Card>
      ) : (
        <>
          {/* Summary banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerPeriod}>{MONTHS[month - 1]} {year}</Text>
            <Text style={styles.bannerAmount}>{fmt(summary.totalSpent)}</Text>
            <Text style={styles.bannerSub}>Total Spent</Text>

            <View style={styles.bannerStats}>
              {[
                { label: 'Transactions', value: summary.totalTransactions },
                { label: 'Daily Avg',    value: fmt(summary.avgPerDay) },
                { label: 'Per Txn',      value: fmt(summary.avgPerTransaction) },
              ].map(s => (
                <View key={s.label} style={styles.bannerStat}>
                  <Text style={styles.bannerStatValue}>{s.value}</Text>
                  <Text style={styles.bannerStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Budget status */}
          {summary.monthlyLimit > 0 && (
            <Card style={{
              borderLeftWidth: 4,
              borderLeftColor: summary.isOverBudget ? COLORS.danger : COLORS.success,
            }}>
              <View style={styles.budgetStatus}>
                <Text style={{ fontSize: 24 }}>
                  {summary.isOverBudget ? '⚠️' : '✅'}
                </Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.budgetStatusTitle, {
                    color: summary.isOverBudget ? COLORS.danger : COLORS.success,
                  }]}>
                    {summary.isOverBudget ? 'Over Budget' : 'Within Budget'}
                  </Text>
                  <Text style={styles.budgetStatusSub}>
                    {summary.isOverBudget
                      ? `Overspent by ${fmt(Math.abs(summary.budgetLeft))}`
                      : `${fmt(summary.budgetLeft)} remaining`
                    } of {fmt(summary.monthlyLimit)}
                  </Text>
                </View>
              </View>

              {/* Progress */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, {
                  width: `${Math.min(Math.round((summary.totalSpent / summary.monthlyLimit) * 100), 100)}%`,
                  backgroundColor: summary.isOverBudget ? COLORS.danger : COLORS.success,
                }]} />
              </View>
            </Card>
          )}

          {/* Category breakdown */}
          {categoryBreakdown?.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>📂 By Category</Text>
              {categoryBreakdown.map(cat => {
                const pct   = summary.totalSpent > 0
                  ? Math.round((cat.totalAmount / summary.totalSpent) * 100)
                  : 0;
                const color = CATEGORY_COLORS[cat._id] || COLORS.gray;
                const icon  = CATEGORY_ICONS[cat._id]  || '📦';

                return (
                  <View key={cat._id} style={styles.catRow}>
                    <Text style={styles.catIcon}>{icon}</Text>
                    <View style={styles.catInfo}>
                      <View style={styles.catNameRow}>
                        <Text style={styles.catName}>{cat._id}</Text>
                        <Text style={styles.catAmount}>{fmt(cat.totalAmount)}</Text>
                      </View>
                      <View style={styles.catTrack}>
                        <View style={[styles.catFill, { width: `${pct}%`, backgroundColor: color }]} />
                      </View>
                      <Text style={styles.catMeta}>{pct}% · {cat.count} txn · avg {fmt(Math.round(cat.avgAmount))}</Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          )}

          {/* Payment methods */}
          {paymentMethodData && Object.keys(paymentMethodData).length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>💳 Payment Methods</Text>
              {Object.entries(paymentMethodData)
                .sort(([, a], [, b]) => b - a)
                .map(([method, amount]) => {
                  const pct = summary.totalSpent > 0
                    ? Math.round((amount / summary.totalSpent) * 100)
                    : 0;
                  return (
                    <View key={method} style={styles.payRow}>
                      <Text style={styles.payMethod}>{method}</Text>
                      <View style={styles.payTrack}>
                        <View style={[styles.payFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.payAmount}>{fmt(amount)}</Text>
                      <Text style={styles.payPct}>{pct}%</Text>
                    </View>
                  );
                })}
            </Card>
          )}

          {/* Note */}
          <Card style={{ backgroundColor: COLORS.primaryLight }}>
            <Text style={{ fontSize: 13, color: COLORS.primary, textAlign: 'center' }}>
              💡 Download CSV or PDF reports from the web app
            </Text>
          </Card>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  content:    { padding: 16, paddingBottom: 32 },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:     { paddingTop: 8, marginBottom: 16 },
  title:      { fontSize: 22, fontWeight: '800', color: COLORS.dark },

  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 16, elevation: 2 },
  monthArrow:    { fontSize: 28, color: COLORS.primary, fontWeight: '700', paddingHorizontal: 16 },
  monthText:     { fontSize: 16, fontWeight: '700', color: COLORS.dark },

  banner: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 20, marginBottom: 12, alignItems: 'center' },
  bannerPeriod: { fontSize: 13, color: '#bfdbfe', fontWeight: '500', marginBottom: 8 },
  bannerAmount: { fontSize: 36, fontWeight: '900', color: COLORS.white, marginBottom: 4 },
  bannerSub:    { fontSize: 13, color: '#bfdbfe', marginBottom: 16 },
  bannerStats:  { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  bannerStat:   { alignItems: 'center' },
  bannerStatValue: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  bannerStatLabel: { fontSize: 10, color: '#93c5fd', marginTop: 2 },

  budgetStatus:      { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  budgetStatusTitle: { fontSize: 15, fontWeight: '700' },
  budgetStatusSub:   { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  progressTrack: { height: 6, backgroundColor: COLORS.lightGray, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, borderRadius: 3 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 14 },

  catRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  catIcon:   { fontSize: 22, width: 32, textAlign: 'center', marginRight: 10 },
  catInfo:   { flex: 1 },
  catNameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catName:   { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  catAmount: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  catTrack:  { height: 4, backgroundColor: COLORS.lightGray, borderRadius: 2, overflow: 'hidden', marginBottom: 3 },
  catFill:   { height: 4, borderRadius: 2 },
  catMeta:   { fontSize: 10, color: COLORS.gray },

  payRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  payMethod: { width: 90, fontSize: 12, color: COLORS.dark, fontWeight: '500' },
  payTrack:  { flex: 1, height: 6, backgroundColor: COLORS.lightGray, borderRadius: 3, overflow: 'hidden', marginHorizontal: 8 },
  payFill:   { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  payAmount: { width: 72, fontSize: 12, fontWeight: '700', color: COLORS.dark, textAlign: 'right' },
  payPct:    { width: 32, fontSize: 11, color: COLORS.gray, textAlign: 'right' },

  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText:  { fontSize: 16, fontWeight: '600', color: COLORS.dark, marginTop: 16 },
  emptySub:   { fontSize: 13, color: COLORS.gray, marginTop: 6 },
});

export default ReportsScreen;