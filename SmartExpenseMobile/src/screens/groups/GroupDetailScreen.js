// ═══════════════════════════════════════════════
// src/screens/groups/GroupDetailScreen.js
// ═══════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  getGroupApi, addGroupExpenseApi,
  deleteGroupExpenseApi, closeGroupApi,
} from '../../api/groupApi';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Card   from '../../components/common/Card';
import { COLORS } from '../../utils/constants';
import { formatDate, getTodayForInput } from '../../utils/formatters';

// ── Add Expense Modal ──
const AddExpenseModal = ({ visible, onClose, onAdd, group, loading }) => {
  const [description,      setDescription]      = useState('');
  const [amount,           setAmount]           = useState('');
  const [paidByMemberId,   setPaidByMemberId]   = useState('');
  const [selectedMembers,  setSelectedMembers]  = useState([]);
  const [date,             setDate]             = useState(getTodayForInput());
  const [error,            setError]            = useState('');

  useEffect(() => {
    if (visible && group) {
      setSelectedMembers(group.members.map(m => m._id));
      setPaidByMemberId(group.members[0]?._id || '');
      setDescription(''); setAmount(''); setDate(getTodayForInput()); setError('');
    }
  }, [visible, group]);

  const toggleMember = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const shareAmount = selectedMembers.length > 0 && amount
    ? Math.round((parseFloat(amount) / selectedMembers.length) * 100) / 100
    : 0;

  const handleAdd = async () => {
    setError('');
    if (!description.trim()) { setError('Description is required'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return; }
    if (!paidByMemberId) { setError('Select who paid'); return; }
    if (selectedMembers.length === 0) { setError('Select at least one member'); return; }

    try {
      await onAdd({
        description, date,
        amount: parseFloat(amount),
        paidByMemberId,
        splitAmongMemberIds: selectedMembers,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalSheet}>
          <View style={styles.handleBar} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>➕ Add Expense</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Hotel, Dinner, Petrol"
              style={styles.fieldInput}
              placeholderTextColor={COLORS.gray}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Amount (₹) *</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={styles.fieldInput}
                  placeholderTextColor={COLORS.gray}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  style={styles.fieldInput}
                  placeholderTextColor={COLORS.gray}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Who Paid? *</Text>
            {group?.members.map(member => (
              <TouchableOpacity
                key={member._id}
                onPress={() => setPaidByMemberId(member._id)}
                style={[
                  styles.memberOption,
                  paidByMemberId === member._id && styles.memberOptionSelected,
                ]}
              >
                <View style={[
                  styles.memberRadio,
                  paidByMemberId === member._id && styles.memberRadioSelected,
                ]}>
                  {paidByMemberId === member._id && (
                    <View style={styles.memberRadioDot} />
                  )}
                </View>
                <Text style={styles.memberOptionText}>{member.name}</Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
              Split Among * ({selectedMembers.length} of {group?.members.length} selected)
            </Text>
            {group?.members.map(member => {
              const isSelected = selectedMembers.includes(member._id);
              return (
                <TouchableOpacity
                  key={member._id}
                  onPress={() => toggleMember(member._id)}
                  style={[
                    styles.memberOption,
                    isSelected && styles.memberOptionSelected,
                  ]}
                >
                  <View style={[
                    styles.memberCheckbox,
                    isSelected && styles.memberCheckboxSelected,
                  ]}>
                    {isSelected && <Text style={{ color: COLORS.white, fontSize: 12 }}>✓</Text>}
                  </View>
                  <Text style={styles.memberOptionText}>{member.name}</Text>
                  {isSelected && amount > 0 && (
                    <Text style={styles.memberShare}>₹{shareAmount}</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            {amount && selectedMembers.length > 0 && (
              <View style={styles.splitSummary}>
                <Text style={styles.splitSummaryText}>
                  ₹{amount} ÷ {selectedMembers.length} = ₹{shareAmount} each
                </Text>
              </View>
            )}

            <View style={styles.modalBtns}>
              <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Add Expense" onPress={handleAdd} loading={loading} style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Main Screen ──
const GroupDetailScreen = ({ route, navigation }) => {
  const { groupId }       = route.params;
  const { user, fmt }     = useAuth();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModal,   setAddModal]   = useState(false);
  const [addingExp,  setAddingExp]  = useState(false);
  const [closing,    setClosing]    = useState(false);
  const [activeTab,  setActiveTab]  = useState('expenses');

  const fetchGroup = useCallback(async () => {
    try {
      const res = await getGroupApi(groupId);
      setData(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load group');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  const handleAddExpense = async (expData) => {
    setAddingExp(true);
    try {
      await addGroupExpenseApi(groupId, expData);
      await fetchGroup();
      setAddModal(false);
    } finally {
      setAddingExp(false);
    }
  };

  const handleDeleteExpense = (expenseId) => {
    Alert.alert('Remove Expense', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroupExpenseApi(groupId, expenseId);
            await fetchGroup();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete expense');
          }
        },
      },
    ]);
  };

  const handleClose = () => {
    Alert.alert(
      '🔒 Close Group',
      'Your share will be automatically added to your expenses. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Group',
          style: 'destructive',
          onPress: async () => {
            setClosing(true);
            try {
              const res = await closeGroupApi(groupId);
              Alert.alert('✅ Group Closed', res.message);
              await fetchGroup();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to close');
            } finally {
              setClosing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!data) return null;

  const { group, expenses, settlements, netBalances } = data;
  const isActive  = group.status === 'active';
  const isCreator = group.createdBy === user?._id ||
    group.createdBy?.toString() === user?._id?.toString();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.detailHeaderInfo}>
          <Text style={styles.detailTitle} numberOfLines={1}>{group.name}</Text>
          {group.description ? (
            <Text style={styles.detailSub} numberOfLines={1}>{group.description}</Text>
          ) : null}
        </View>
        {isActive && (
          <TouchableOpacity
            style={styles.addExpBtn}
            onPress={() => setAddModal(true)}
          >
            <Text style={styles.addExpBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.detailContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchGroup(); }}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Closed banner */}
        {group.status === 'closed' && (
          <View style={styles.closedBanner}>
            <Text style={styles.closedText}>
              🔒 Closed on {formatDate(group.closedAt)} · Your share added to expenses
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total',    value: fmt(group.totalAmount || 0), icon: '💰' },
            { label: 'Members',  value: group.members?.length || 0,             icon: '👥' },
            { label: 'Expenses', value: expenses?.length || 0,                  icon: '📋' },
          ].map(stat => (
            <Card key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* Members */}
        <Card>
          <Text style={styles.sectionTitle}>
            Members ({group.members?.length})
          </Text>
          <View style={styles.membersWrap}>
            {group.members?.map(member => (
              <View key={member._id} style={styles.memberPill}>
                <View style={styles.memberPillAvatar}>
                  <Text style={styles.memberPillAvatarText}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.memberPillName}>{member.name}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['expenses', 'settlements'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'expenses'
                  ? `📋 Expenses (${expenses?.length || 0})`
                  : '💸 Settlements'
                }
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <Card>
            {expenses?.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 40 }}>📋</Text>
                <Text style={styles.emptyText}>No expenses yet</Text>
                {isActive && (
                  <Button
                    title="Add First Expense"
                    onPress={() => setAddModal(true)}
                    style={{ marginTop: 12 }}
                  />
                )}
              </View>
            ) : (
              expenses.map(expense => (
                <View key={expense._id} style={styles.expRow}>
                  <View style={styles.expInfo}>
                    <View style={styles.expTopRow}>
                      <Text style={styles.expDesc} numberOfLines={1}>
                        {expense.description}
                      </Text>
                      <Text style={styles.expAmount}>
                        {fmt(expense.amount)}
                      </Text>
                    </View>
                    <Text style={styles.expPaidBy}>
                      Paid by <Text style={{ fontWeight: '700' }}>
                        {expense.paidByMemberName}
                      </Text> · {formatDate(expense.date)}
                    </Text>
                    <View style={styles.expSplitRow}>
                      <Text style={styles.expSplitLabel}>Split: </Text>
                      {expense.splitAmong?.map(share => (
                        <View key={share.memberId} style={styles.expSplitBadge}>
                          <Text style={styles.expSplitBadgeText}>
                            {share.memberName} (₹{share.shareAmount})
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  {isActive && (
                    <TouchableOpacity
                      onPress={() => handleDeleteExpense(expense._id)}
                      style={styles.expDeleteBtn}
                    >
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </Card>
        )}

        {/* Settlements Tab */}
        {activeTab === 'settlements' && (
          <Card>
            <Text style={styles.sectionTitle}>Net Balances</Text>
            {netBalances?.map(person => (
              <View key={person.memberId} style={styles.balanceRow}>
                <View style={styles.balanceAvatar}>
                  <Text style={styles.balanceAvatarText}>
                    {person.memberName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.balanceName}>{person.memberName}</Text>
                <Text style={[
                  styles.balanceAmount,
                  { color: person.balance > 0 ? COLORS.success :
                            person.balance < 0 ? COLORS.danger  : COLORS.gray },
                ]}>
                  {person.balance > 0
                    ? `+${fmt(person.balance)}`
                    : person.balance < 0
                    ? `-${fmt(Math.abs(person.balance))}`
                    : 'Settled'
                  }
                </Text>
              </View>
            ))}

            {settlements?.length > 0 ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>
                  Transactions ({settlements.length})
                </Text>
                {settlements.map((s, i) => (
                  <View key={i} style={styles.settlementRow}>
                    <View style={styles.settlementPerson}>
                      <View style={[styles.settlementAvatar, { backgroundColor: '#fef2f2' }]}>
                        <Text style={{ fontWeight: '700', color: COLORS.danger }}>
                          {s.from.memberName.charAt(0)}
                        </Text>
                      </View>
                      <Text style={styles.settlementName}>{s.from.memberName}</Text>
                    </View>

                    <View style={styles.settlementMid}>
                      <Text style={styles.settlementAmount}>
                        {fmt(s.amount)}
                      </Text>
                      <Text style={{ color: COLORS.primary, fontSize: 18 }}>→</Text>
                    </View>

                    <View style={[styles.settlementPerson, { alignItems: 'flex-end' }]}>
                      <View style={[styles.settlementAvatar, { backgroundColor: '#f0fdf4' }]}>
                        <Text style={{ fontWeight: '700', color: COLORS.success }}>
                          {s.to.memberName.charAt(0)}
                        </Text>
                      </View>
                      <Text style={styles.settlementName}>{s.to.memberName}</Text>
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 36 }}>✅</Text>
                <Text style={styles.emptyText}>Everyone is settled up!</Text>
              </View>
            )}
          </Card>
        )}

        {/* Close group button */}
        {isActive && isCreator && (
          <Button
            title={closing ? 'Closing...' : '🔒 Close Group'}
            variant="danger"
            onPress={handleClose}
            loading={closing}
            style={{ marginTop: 8 }}
          />
        )}

      </ScrollView>

      <AddExpenseModal
        visible={addModal}
        onClose={() => setAddModal(false)}
        onAdd={handleAddExpense}
        group={group}
        loading={addingExp}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background },
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  detailContent: { padding: 16, paddingBottom: 40 },

  detailHeader:     { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn:          { marginRight: 12, padding: 4 },
  backText:         { fontSize: 22, color: COLORS.primary, fontWeight: '700' },
  detailHeaderInfo: { flex: 1 },
  detailTitle:      { fontSize: 17, fontWeight: '800', color: COLORS.dark },
  detailSub:        { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  addExpBtn:        { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  addExpBtnText:    { color: COLORS.white, fontWeight: '700', fontSize: 13 },

  closedBanner: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12, marginBottom: 12 },
  closedText:   { fontSize: 12, color: COLORS.gray, textAlign: 'center' },

  statsRow:  { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard:  { flex: 1, alignItems: 'center', padding: 12, marginBottom: 0 },
  statIcon:  { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.dark, marginBottom: 2 },
  statLabel: { fontSize: 10, color: COLORS.gray },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 12 },

  membersWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memberPill:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  memberPillAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  memberPillAvatarText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  memberPillName: { fontSize: 12, color: COLORS.dark, fontWeight: '500' },

  tabs:         { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, padding: 4, marginBottom: 12, elevation: 1 },
  tab:          { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive:    { backgroundColor: COLORS.primary },
  tabText:      { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  tabTextActive: { color: COLORS.white, fontWeight: '700' },

  expRow:       { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, flexDirection: 'row', alignItems: 'flex-start' },
  expInfo:      { flex: 1 },
  expTopRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  expDesc:      { fontSize: 14, fontWeight: '700', color: COLORS.dark, flex: 1, marginRight: 8 },
  expAmount:    { fontSize: 14, fontWeight: '800', color: COLORS.dark },
  expPaidBy:    { fontSize: 11, color: COLORS.gray, marginBottom: 6 },
  expSplitRow:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  expSplitLabel:{ fontSize: 10, color: COLORS.gray },
  expSplitBadge: { backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  expSplitBadgeText: { fontSize: 10, color: COLORS.primary, fontWeight: '600' },
  expDeleteBtn: { padding: 8 },

  balanceRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  balanceAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  balanceAvatarText: { fontWeight: '700', color: COLORS.primary },
  balanceName:  { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.dark },
  balanceAmount: { fontSize: 14, fontWeight: '800' },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },

  settlementRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  settlementPerson: { flex: 1, alignItems: 'flex-start' },
  settlementAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  settlementName:  { fontSize: 11, color: COLORS.gray, fontWeight: '500' },
  settlementMid:   { alignItems: 'center', paddingHorizontal: 16 },
  settlementAmount: { fontSize: 14, fontWeight: '800', color: COLORS.dark, marginBottom: 2 },

  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText:  { fontSize: 15, fontWeight: '600', color: COLORS.dark, marginTop: 12 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet:   { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  handleBar:    { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: COLORS.dark },
  modalClose:   { fontSize: 18, color: COLORS.gray, padding: 4 },
  errorBox:     { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText:    { color: COLORS.danger, fontSize: 13 },
  fieldLabel:   { fontSize: 13, fontWeight: '600', color: COLORS.dark, marginBottom: 6 },
  fieldInput:   { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.dark, marginBottom: 16, backgroundColor: COLORS.white },
  memberOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, backgroundColor: COLORS.lightGray, borderWidth: 1.5, borderColor: 'transparent' },
  memberOptionSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  memberOptionText: { flex: 1, fontSize: 14, color: COLORS.dark, fontWeight: '500', marginLeft: 10 },
  memberShare:  { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  memberRadio:  { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  memberRadioSelected: { borderColor: COLORS.primary },
  memberRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  memberCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  memberCheckboxSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  splitSummary: { backgroundColor: COLORS.primaryLight, borderRadius: 10, padding: 12, marginBottom: 16 },
  splitSummaryText: { fontSize: 13, color: COLORS.primary, fontWeight: '600', textAlign: 'center' },
  modalBtns:    { flexDirection: 'row', marginBottom: 20 },
});

export default GroupDetailScreen;