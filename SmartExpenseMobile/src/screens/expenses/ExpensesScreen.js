// ═══════════════════════════════════════════════
// src/screens/expenses/ExpensesScreen.js
// ═══════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, TextInput, Modal,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  getExpensesApi, createExpenseApi,
  updateExpenseApi, deleteExpenseApi,
} from '../../api/expenseApi';
import Button from '../../components/common/Button';
import { COLORS, CATEGORIES, PAYMENT_METHODS,
         CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/constants';
import { formatDate, getTodayForInput } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

// ── Expense Form Modal ──
const ExpenseModal = ({ visible, onClose, onSave, expense, loading }) => {
  const isEdit = !!expense;

  const [amount,        setAmount]        = useState('');
  const [category,      setCategory]      = useState('Food & Dining');
  const [description,   setDescription]   = useState('');
  const [date,          setDate]          = useState(getTodayForInput());
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [merchant,      setMerchant]      = useState('');
  const [error,         setError]         = useState('');

  useEffect(() => {
    if (visible) {
      if (isEdit && expense) {
        setAmount(expense.amount?.toString() || '');
        setCategory(expense.category || 'Food & Dining');
        setDescription(expense.description || '');
        setDate(expense.date ? expense.date.split('T')[0] : getTodayForInput());
        setPaymentMethod(expense.paymentMethod || 'UPI');
        setMerchant(expense.merchant || '');
      } else {
        setAmount(''); setCategory('Food & Dining');
        setDescription(''); setDate(getTodayForInput());
        setPaymentMethod('UPI'); setMerchant('');
      }
      setError('');
    }
  }, [visible, expense]);

  const handleSave = async () => {
    setError('');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Enter a valid amount'); return;
    }
    if (!description.trim()) {
      setError('Description is required'); return;
    }
    try {
      await onSave({
        amount: parseFloat(amount),
        category, description, date,
        paymentMethod, merchant,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalSheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEdit ? '✏️ Edit Expense' : '➕ Add Expense'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Amount */}
            <Text style={styles.fieldLabel}>Amount (₹) *</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              style={styles.fieldInput}
              placeholderTextColor={COLORS.gray}
            />

            {/* Description */}
            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What did you spend on?"
              style={styles.fieldInput}
              placeholderTextColor={COLORS.gray}
            />

            {/* Category Picker */}
            <Text style={styles.fieldLabel}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.chip,
                    category === cat && styles.chipSelected,
                  ]}
                >
                  <Text style={styles.chipIcon}>{CATEGORY_ICONS[cat]}</Text>
                  <Text style={[
                    styles.chipText,
                    category === cat && styles.chipTextSelected,
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Date */}
            <Text style={styles.fieldLabel}>Date *</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              style={styles.fieldInput}
              placeholderTextColor={COLORS.gray}
            />

            {/* Payment Method */}
            <Text style={styles.fieldLabel}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {PAYMENT_METHODS.map(method => (
                <TouchableOpacity
                  key={method}
                  onPress={() => setPaymentMethod(method)}
                  style={[
                    styles.chip,
                    paymentMethod === method && styles.chipSelected,
                  ]}
                >
                  <Text style={[
                    styles.chipText,
                    paymentMethod === method && styles.chipTextSelected,
                  ]}>
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Merchant */}
            <Text style={styles.fieldLabel}>Merchant (optional)</Text>
            <TextInput
              value={merchant}
              onChangeText={setMerchant}
              placeholder="e.g. Swiggy, Amazon"
              style={styles.fieldInput}
              placeholderTextColor={COLORS.gray}
            />

            {/* Buttons */}
            <View style={styles.modalBtns}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={onClose}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={isEdit ? 'Save Changes' : 'Add Expense'}
                onPress={handleSave}
                loading={loading}
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const SOURCE_BADGE = {
  receipt_scan: { label: '📷 Scanned', bg: '#eff6ff', color: COLORS.primary },
  upi_auto:     { label: '⚡ Auto',    bg: '#f0fdf4', color: COLORS.success  },
};

// ── Expense Card ──
const ExpenseCard = ({ expense, onEdit, onDelete }) => {
  const color = CATEGORY_COLORS[expense.category] || COLORS.gray;
  const icon  = CATEGORY_ICONS[expense.category]  || '📦';
  const badge = SOURCE_BADGE[expense.source];

  const confirmDelete = () => {
    Alert.alert(
      'Delete Expense',
      `Delete "${expense.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(expense._id) },
      ]
    );
  };

  return (
    <View style={styles.expenseCard}>
      <View style={[styles.expenseIcon, { backgroundColor: `${color}20` }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>

      <View style={styles.expenseInfo}>
        <Text style={styles.expenseDesc} numberOfLines={1}>
          {expense.description}
        </Text>
        <View style={styles.expenseMeta}>
          <Text style={[styles.expenseCat, { color }]}>{expense.category}</Text>
          <Text style={styles.expenseDot}>·</Text>
          <Text style={styles.expenseMethod}>{expense.paymentMethod}</Text>
          {expense.merchant ? (
            <>
              <Text style={styles.expenseDot}>·</Text>
              <Text style={styles.expenseMerchant}>{expense.merchant}</Text>
            </>
          ) : null}
        </View>
        <View style={styles.expenseDateRow}>
          <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
          {badge && (
            <View style={[styles.sourceBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.sourceBadgeText, { color: badge.color }]}>
                {badge.label}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.expenseRight}>
        <Text style={styles.expenseAmount}>{fmt(expense.amount)}</Text>
        <View style={styles.expenseActions}>
          <TouchableOpacity onPress={() => onEdit(expense)} style={styles.actionBtn}>
            <Text style={{ fontSize: 14 }}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} style={styles.actionBtn}>
            <Text style={{ fontSize: 14 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ── Main Screen ──
const ExpensesScreen = () => {
  const { fmt } = useAuth();
  const [expenses,   setExpenses]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [savingExp,  setSavingExp]  = useState(false);
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('All');
  const [page,       setPage]       = useState(1);

  const fetchExpenses = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const params = {
        page: pageNum, limit: 15,
        sortBy: 'date', sortOrder: 'desc',
      };
      if (search)           params.search = search;
      if (category !== 'All') params.category = category;

      const res = await getExpensesApi(params);
      const newExpenses = res.data.expenses || [];

      setExpenses(prev => reset ? newExpenses : [...prev, ...newExpenses]);
      setPagination(res.data.pagination);
    } catch (err) {
      console.log('Fetch expenses error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, category]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchExpenses(1, true);
  }, [search, category]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchExpenses(1, true);
  };

  const loadMore = () => {
    if (pagination?.hasNextPage) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchExpenses(nextPage, false);
    }
  };

  const handleCreate = async (data) => {
    setSavingExp(true);
    try {
      await createExpenseApi(data);
      setModalOpen(false);
      onRefresh();
    } finally {
      setSavingExp(false);
    }
  };

  const handleUpdate = async (data) => {
    setSavingExp(true);
    try {
      await updateExpenseApi(editExpense._id, data);
      setEditExpense(null);
      onRefresh();
    } finally {
      setSavingExp(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpenseApi(id);
      setExpenses(prev => prev.filter(e => e._id !== id));
    } catch (err) {
      Alert.alert('Error', 'Failed to delete expense');
    }
  };

  const totalVisible = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.expHeader}>
        <Text style={styles.expTitle}>💸 Expenses</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search expenses..."
          placeholderTextColor={COLORS.gray}
          style={styles.searchInput}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: COLORS.gray }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
        bounces={false}
      >
        {['All', ...CATEGORIES].map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategory(cat)}
            style={[
              styles.filterChip,
              category === cat && styles.filterChipActive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                category === cat && styles.filterChipTextActive,
              ]}
              numberOfLines={1}
            >
              {cat === 'All' ? '✦ All' : `${CATEGORY_ICONS[cat]} ${cat}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary bar */}
      {expenses.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {pagination?.totalCount || expenses.length} expenses
          </Text>
          <Text style={styles.summaryTotal}>
            Total: {fmt(totalVisible)}
          </Text>
        </View>
      )}

      {/* Expense List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <ExpenseCard
              expense={item}
              onEdit={exp => { setEditExpense(exp); }}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48 }}>💸</Text>
              <Text style={styles.emptyText}>No expenses found</Text>
              <Text style={styles.emptySub}>
                {search || category !== 'All'
                  ? 'Try adjusting your filters'
                  : 'Add your first expense!'
                }
              </Text>
            </View>
          )}
          ListFooterComponent={() =>
            pagination?.hasNextPage ? (
              <ActivityIndicator
                color={COLORS.primary}
                style={{ margin: 16 }}
              />
            ) : null
          }
        />
      )}

      {/* Add Modal */}
      <ExpenseModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCreate}
        loading={savingExp}
      />

      {/* Edit Modal */}
      <ExpenseModal
        visible={!!editExpense}
        onClose={() => setEditExpense(null)}
        onSave={handleUpdate}
        expense={editExpense}
        loading={savingExp}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },

  expHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 20 },
  expTitle:   { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  addBtn:     { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  searchBar:   { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, height: 44, elevation: 2 },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.dark },

  filterScroll:        { height: 54, marginBottom: 4 },
  filterScrollContent: { paddingHorizontal: 16, alignItems: 'center' },
  filterChip: {
    flexShrink:       0,
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      20,
    backgroundColor:  COLORS.white,
    borderWidth:       1,
    borderColor:      COLORS.border,
    marginRight:       8,
    // Android shadow so chip doesn't look flat when scrolled
    elevation:         1,
  },
  filterChipActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary, elevation: 0 },
  filterChipText:       { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  filterChipTextActive: { color: COLORS.white, fontWeight: '700' },

  summaryBar:  { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.primaryLight },
  summaryText: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  summaryTotal: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },

  listContent: { padding: 16, paddingTop: 8 },

  expenseCard:   { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  expenseIcon:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  expenseInfo:   { flex: 1 },
  expenseDesc:   { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 3 },
  expenseMeta:   { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 },
  expenseCat:    { fontSize: 11, fontWeight: '600' },
  expenseDot:    { fontSize: 11, color: COLORS.gray, marginHorizontal: 3 },
  expenseMethod: { fontSize: 11, color: COLORS.gray },
  expenseMerchant: { fontSize: 11, color: COLORS.gray },
  expenseDateRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  expenseDate:     { fontSize: 11, color: COLORS.gray },
  sourceBadge:     { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  sourceBadgeText: { fontSize: 10, fontWeight: '700' },
  expenseRight:  { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 15, fontWeight: '800', color: COLORS.dark, marginBottom: 6 },
  expenseActions: { flexDirection: 'row', gap: 4 },
  actionBtn:     { padding: 6, backgroundColor: COLORS.lightGray, borderRadius: 8 },

  emptyState:  { alignItems: 'center', paddingVertical: 60 },
  emptyText:   { fontSize: 16, fontWeight: '600', color: COLORS.dark, marginTop: 16 },
  emptySub:    { fontSize: 13, color: COLORS.gray, marginTop: 6, textAlign: 'center' },

  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet:   { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  handleBar:    { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: COLORS.dark },
  modalClose:   { fontSize: 18, color: COLORS.gray, padding: 4 },

  errorBox:   { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText:  { color: COLORS.danger, fontSize: 13, fontWeight: '500' },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.dark, marginBottom: 6 },
  fieldInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.dark, marginBottom: 16, backgroundColor: COLORS.white },

  chipScroll: { marginBottom: 16 },
  chip:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.lightGray, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  chipSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  chipIcon:   { fontSize: 14, marginRight: 4 },
  chipText:   { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  chipTextSelected: { color: COLORS.primary, fontWeight: '700' },

  modalBtns: { flexDirection: 'row', marginTop: 8, marginBottom: 20 },
});

export default ExpensesScreen;