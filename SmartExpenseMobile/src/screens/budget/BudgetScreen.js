// ═══════════════════════════════════════════════
// src/screens/budget/BudgetScreen.js
// ═══════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator, Modal,
  TextInput, Alert,
} from 'react-native';
import { getBudgetApi, updateBudgetApi } from '../../api/budgetApi';
import Card   from '../../components/common/Card';
import Button from '../../components/common/Button';
import { COLORS, CATEGORIES, CATEGORY_ICONS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Progress Bar ──
const BudgetBar = ({ label, icon, spent, limit, status }) => {
  const pct = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;

  const barColor =
    status === 'exceeded' ? COLORS.danger  :
    status === 'danger'   ? COLORS.danger  :
    status === 'warning'  ? COLORS.warning :
    COLORS.success;

  const bgColor =
    status === 'exceeded' ? '#fef2f2' :
    status === 'danger'   ? '#fef2f2' :
    status === 'warning'  ? '#fffbeb' :
    '#f0fdf4';

  if (limit <= 0) return null;

  return (
    <View style={[styles.barCard, { backgroundColor: bgColor }]}>
      <View style={styles.barHeader}>
        <View style={styles.barLeft}>
          {icon ? <Text style={styles.barIcon}>{icon}</Text> : null}
          <Text style={styles.barLabel}>{label}</Text>
        </View>
        <Text style={[styles.barPct, { color: barColor }]}>{pct}%</Text>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>

      <View style={styles.barAmounts}>
        <Text style={styles.barSpent}>Spent: {fmt(spent)}</Text>
        <Text style={styles.barRemaining}>
          {spent > limit
            ? `Over by ${fmt(spent - limit)}`
            : `${fmt(limit - spent)} left`
          }
        </Text>
      </View>
    </View>
  );
};

// ── Edit Budget Modal ──
const EditBudgetModal = ({ visible, onClose, onSave, currentBudget, loading }) => {
  const [monthlyLimit,    setMonthlyLimit]    = useState('');
  const [categoryLimits,  setCategoryLimits]  = useState({});

  useEffect(() => {
    if (visible && currentBudget) {
      setMonthlyLimit(
        currentBudget.budget?.monthlyLimit > 0
          ? currentBudget.budget.monthlyLimit.toString()
          : ''
      );
      const limits = {};
      currentBudget.budget?.categoryBudgets?.forEach(({ category, limit }) => {
        limits[category] = limit.toString();
      });
      setCategoryLimits(limits);
    }
  }, [visible, currentBudget]);

  const handleSave = async () => {
    const categoryBudgets = CATEGORIES.map(cat => ({
      category: cat,
      limit: parseFloat(categoryLimits[cat]) || 0,
    }));
    try {
      await onSave({
        monthlyLimit: parseFloat(monthlyLimit) || 0,
        categoryBudgets,
      });
      onClose();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.handleBar} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🎯 Set Budget Limits</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Monthly limit */}
            <Text style={styles.sectionTitle}>💰 Monthly Budget</Text>
            <TextInput
              value={monthlyLimit}
              onChangeText={setMonthlyLimit}
              placeholder="e.g. 30000"
              keyboardType="decimal-pad"
              style={styles.fieldInput}
              placeholderTextColor={COLORS.gray}
            />
            <Text style={styles.fieldHint}>Leave empty for no limit</Text>

            {/* Category limits */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              📂 Category Budgets
            </Text>
            <Text style={styles.fieldHint}>Leave empty to skip that category</Text>

            {CATEGORIES.map(cat => (
              <View key={cat} style={styles.catLimitRow}>
                <Text style={styles.catLimitIcon}>{CATEGORY_ICONS[cat]}</Text>
                <Text style={styles.catLimitName}>{cat}</Text>
                <TextInput
                  value={categoryLimits[cat] || ''}
                  onChangeText={val =>
                    setCategoryLimits(prev => ({ ...prev, [cat]: val }))
                  }
                  placeholder="₹"
                  keyboardType="decimal-pad"
                  style={styles.catLimitInput}
                  placeholderTextColor={COLORS.gray}
                />
              </View>
            ))}

            <View style={styles.modalBtns}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={onClose}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Save Budgets"
                onPress={handleSave}
                loading={loading}
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ── Main Screen ──
const BudgetScreen = () => {
  const { fmt } = useAuth();
  const now = new Date();
  const [month,     setMonth]     = useState(now.getMonth() + 1);
  const [year,      setYear]      = useState(now.getFullYear());
  const [budgetData, setBudgetData] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBudgetApi(month, year);
      setBudgetData(res.data);
    } catch (err) {
      console.log('Budget fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month, year]);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      await updateBudgetApi({ ...data, month, year });
      await fetchBudget();
      Alert.alert('✅ Saved', 'Budget limits updated successfully');
    } finally {
      setSaving(false);
    }
  };

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchBudget(); }}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetTitle}>🎯 Budget</Text>
          <View style={styles.headerBtns}>
            {budgetData?.overall?.limit > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  Alert.alert(
                    'Clear Budget',
                    'This will reset all budget limits for this month to zero. Continue?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Clear',
                        style: 'destructive',
                        onPress: async () => {
                          setSaving(true);
                          try {
                            await updateBudgetApi({
                              monthlyLimit: 0,
                              categoryBudgets: CATEGORIES.map(cat => ({ category: cat, limit: 0 })),
                              month,
                              year,
                            });
                            await fetchBudget();
                            Alert.alert('✅ Cleared', 'Budget limits have been reset.');
                          } catch (err) {
                            Alert.alert('Error', 'Failed to clear budget');
                          } finally {
                            setSaving(false);
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.clearBtnText}>🗑️ Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.editBtn} onPress={() => setModalOpen(true)}>
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>
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

        {/* Overall budget */}
        <Card>
          <Text style={styles.sectionTitle}>💰 Overall Budget</Text>
          {budgetData?.overall?.limit > 0 ? (
            <>
              <BudgetBar
                label="Monthly Budget"
                spent={budgetData.overall.spent}
                limit={budgetData.overall.limit}
                status={budgetData.overall.status}
              />
              <View style={styles.overallStats}>
                {[
                  { label: 'Budget',   value: fmt(budgetData.overall.limit), color: COLORS.dark },
                  { label: 'Spent',    value: fmt(budgetData.overall.spent),
                    color: budgetData.overall.isOverBudget ? COLORS.danger : COLORS.dark },
                  { label: budgetData.overall.remaining >= 0 ? 'Left' : 'Over',
                    value: fmt(Math.abs(budgetData.overall.remaining || 0)),
                    color: (budgetData.overall.remaining || 0) >= 0 ? COLORS.success : COLORS.danger },
                ].map(stat => (
                  <View key={stat.label} style={styles.overallStat}>
                    <Text style={styles.overallStatLabel}>{stat.label}</Text>
                    <Text style={[styles.overallStatValue, { color: stat.color }]}>
                      {stat.value}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyBudget}>
              <Text style={{ fontSize: 36 }}>🎯</Text>
              <Text style={styles.emptyBudgetText}>No monthly budget set</Text>
              <Button
                title="Set Budget"
                onPress={() => setModalOpen(true)}
                style={{ marginTop: 12, paddingHorizontal: 32 }}
              />
            </View>
          )}
        </Card>

        {/* Category budgets */}
        {budgetData?.categories?.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>📂 Category Budgets</Text>
            {budgetData.categories.map(cat => (
              <BudgetBar
                key={cat.category}
                label={cat.category}
                icon={CATEGORY_ICONS[cat.category]}
                spent={cat.spent}
                limit={cat.limit}
                status={cat.status}
              />
            ))}
          </Card>
        )}

        {/* Untracked spending */}
        {budgetData?.untrackedCategories?.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>📊 Untracked Spending</Text>
            <Text style={styles.fieldHint}>Spending without budget limits set</Text>
            {budgetData.untrackedCategories.map(({ category, spent }) => (
              <View key={category} style={styles.untrackedRow}>
                <Text style={styles.untrackedIcon}>{CATEGORY_ICONS[category]}</Text>
                <Text style={styles.untrackedCat}>{category}</Text>
                <Text style={styles.untrackedAmount}>{fmt(spent)}</Text>
              </View>
            ))}
          </Card>
        )}

      </ScrollView>

      <EditBudgetModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        currentBudget={budgetData}
        loading={saving}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  content:    { padding: 16, paddingBottom: 32 },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center' },

  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingTop: 8 },
  budgetTitle:  { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  headerBtns:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearBtn:     { backgroundColor: '#fef2f2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  clearBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: 13 },
  editBtn:      { backgroundColor: COLORS.primaryLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  editBtnText:  { color: COLORS.primary, fontWeight: '700', fontSize: 13 },

  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 16, elevation: 2 },
  monthArrow:    { fontSize: 28, color: COLORS.primary, fontWeight: '700', paddingHorizontal: 16 },
  monthText:     { fontSize: 16, fontWeight: '700', color: COLORS.dark },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 14 },
  fieldHint:    { fontSize: 11, color: COLORS.gray, marginBottom: 8, marginTop: -4 },

  barCard:     { borderRadius: 12, padding: 12, marginBottom: 10 },
  barHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  barLeft:     { flexDirection: 'row', alignItems: 'center' },
  barIcon:     { fontSize: 18, marginRight: 8 },
  barLabel:    { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  barPct:      { fontSize: 13, fontWeight: '700' },
  barTrack:    { height: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  barFill:     { height: 8, borderRadius: 4 },
  barAmounts:  { flexDirection: 'row', justifyContent: 'space-between' },
  barSpent:    { fontSize: 11, color: COLORS.gray },
  barRemaining:{ fontSize: 11, color: COLORS.gray },

  overallStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  overallStat:  { alignItems: 'center' },
  overallStatLabel: { fontSize: 11, color: COLORS.gray, marginBottom: 4 },
  overallStatValue: { fontSize: 15, fontWeight: '800' },

  emptyBudget: { alignItems: 'center', paddingVertical: 20 },
  emptyBudgetText: { fontSize: 14, color: COLORS.gray, marginTop: 10 },

  untrackedRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  untrackedIcon:   { fontSize: 20, marginRight: 10, width: 28 },
  untrackedCat:    { flex: 1, fontSize: 13, color: COLORS.dark, fontWeight: '500' },
  untrackedAmount: { fontSize: 13, fontWeight: '700', color: COLORS.dark },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet:   { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '92%' },
  handleBar:    { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: COLORS.dark },
  modalClose:   { fontSize: 18, color: COLORS.gray, padding: 4 },
  fieldInput:   { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.dark, marginBottom: 8, backgroundColor: COLORS.white },
  catLimitRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  catLimitIcon: { fontSize: 20, width: 32, textAlign: 'center', marginRight: 8 },
  catLimitName: { flex: 1, fontSize: 13, color: COLORS.dark, fontWeight: '500' },
  catLimitInput: { width: 90, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: COLORS.dark, textAlign: 'right' },
  modalBtns:    { flexDirection: 'row', marginTop: 20, marginBottom: 20 },
});

export default BudgetScreen;