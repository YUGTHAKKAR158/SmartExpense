// ═══════════════════════════════════════════════
// src/screens/groups/GroupsScreen.js
// ═══════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal,
  ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  getGroupsApi, createGroupApi, deleteGroupApi,
  getMyInvitesApi, acceptInviteApi, declineInviteApi,
} from '../../api/groupApi';
import { useAuth } from '../../context/AuthContext';
import Button  from '../../components/common/Button';
import Card    from '../../components/common/Card';
import { COLORS } from '../../utils/constants';

const TRIP_CATEGORIES = ['Travel','Food & Dining','Entertainment','Shopping','Other'];

const STATUS_COLORS = {
  active:  { bg: '#f0fdf4', text: '#16a34a', label: 'Active' },
  settled: { bg: '#eff6ff', text: '#2563eb', label: 'Settled' },
  closed:  { bg: '#f8fafc', text: '#64748b', label: 'Closed' },
};

const CATEGORY_EMOJIS = {
  'Travel': '✈️', 'Food & Dining': '🍽️',
  'Entertainment': '🎬', 'Shopping': '🛍️', 'Other': '👥',
};

// ── Create Group Modal ──
const CreateGroupModal = ({ visible, onClose, onCreate, user }) => {
  const [name,         setName]         = useState('');
  const [description,  setDescription]  = useState('');
  const [tripCategory, setTripCategory] = useState('Travel');
  const [members,      setMembers]      = useState([{ name: '', email: '' }]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const reset = () => {
    setName(''); setDescription(''); setTripCategory('Travel');
    setMembers([{ name: '', email: '' }]); setError('');
  };

  const handleCreate = async () => {
    setError('');
    if (!name.trim()) { setError('Group name is required'); return; }
    setLoading(true);
    try {
      const validMembers = members.filter(m => m.name.trim());
      await onCreate({ name: name.trim(), description, tripCategory, members: validMembers });
      reset();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
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
            <Text style={styles.modalTitle}>👥 New Group</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>Group Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Goa Trip 2026"
              style={styles.fieldInput}
              placeholderTextColor={COLORS.gray}
            />

            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="About this group..."
              style={styles.fieldInput}
              placeholderTextColor={COLORS.gray}
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {TRIP_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setTripCategory(cat)}
                  style={[
                    styles.chip,
                    tripCategory === cat && styles.chipSelected,
                  ]}
                >
                  <Text style={styles.chipIcon}>{CATEGORY_EMOJIS[cat]}</Text>
                  <Text style={[
                    styles.chipText,
                    tripCategory === cat && styles.chipTextSelected,
                  ]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Creator badge */}
            <Text style={styles.fieldLabel}>Members</Text>
            <View style={styles.creatorBadge}>
              <Text style={styles.creatorAvatar}>
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
              <View>
                <Text style={styles.creatorName}>{user?.name}</Text>
                <Text style={styles.creatorLabel}>You (creator)</Text>
              </View>
            </View>

            {/* Other members */}
            {members.map((member, idx) => (
              <View key={idx} style={styles.memberBlock}>
                <View style={styles.memberInputRow}>
                  <TextInput
                    value={member.name}
                    onChangeText={val => {
                      const updated = [...members];
                      updated[idx] = { ...updated[idx], name: val };
                      setMembers(updated);
                    }}
                    placeholder={`Member ${idx + 1} name`}
                    style={[styles.fieldInput, { flex: 1, marginRight: 8, marginBottom: 0 }]}
                    placeholderTextColor={COLORS.gray}
                  />
                  <TouchableOpacity
                    onPress={() => setMembers(prev => prev.filter((_, i) => i !== idx))}
                    style={styles.removeMemberBtn}
                  >
                    <Text style={{ color: COLORS.danger }}>✕</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={member.email}
                  onChangeText={val => {
                    const updated = [...members];
                    updated[idx] = { ...updated[idx], email: val };
                    setMembers(updated);
                  }}
                  placeholder={`Member ${idx + 1} email (for invite)`}
                  style={[styles.fieldInput, { marginTop: 6, marginBottom: 12 }]}
                  placeholderTextColor={COLORS.gray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={() => setMembers(prev => [...prev, { name: '', email: '' }])}
              style={styles.addMemberBtn}
            >
              <Text style={styles.addMemberText}>+ Add Member</Text>
            </TouchableOpacity>

            <View style={styles.modalBtns}>
              <Button title="Cancel" variant="secondary" onPress={() => { reset(); onClose(); }} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Create Group" onPress={handleCreate} loading={loading} style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Invites Modal ──
const InvitesModal = ({ visible, onClose, onRefresh }) => {
  const [invites,  setInvites]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    if (visible) fetchInvites();
  }, [visible]);

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const res = await getMyInvitesApi();
      setInvites(res.data.invites || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (groupId) => {
    setActionId(groupId);
    try {
      await acceptInviteApi(groupId);
      setInvites(prev => prev.filter(i => i.groupId !== groupId));
      onRefresh();
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (groupId) => {
    setActionId(groupId);
    try {
      await declineInviteApi(groupId);
      setInvites(prev => prev.filter(i => i.groupId !== groupId));
    } finally {
      setActionId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
          <View style={styles.handleBar} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📨 My Invites</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : invites.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={styles.emptyText}>No pending invites</Text>
            </View>
          ) : (
            <ScrollView>
              {invites.map(invite => (
                <View key={invite.groupId} style={styles.inviteCard}>
                  <Text style={styles.inviteName}>{invite.groupName}</Text>
                  <Text style={styles.inviteBy}>
                    Invited by {invite.createdBy} · {invite.memberCount} members
                  </Text>
                  <View style={styles.inviteBtns}>
                    <Button
                      title="Decline"
                      variant="secondary"
                      onPress={() => handleDecline(invite.groupId)}
                      loading={actionId === invite.groupId}
                      style={{ flex: 1, marginRight: 8 }}
                    />
                    <Button
                      title="Accept"
                      onPress={() => handleAccept(invite.groupId)}
                      loading={actionId === invite.groupId}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ── Main Screen ──
const GroupsScreen = ({ navigation }) => {
  const { user, fmt }       = useAuth();
  const [groups,     setGroups]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);

  const fetchGroups = useCallback(async () => {
    try {
      const [groupsRes, invitesRes] = await Promise.all([
        getGroupsApi(),
        getMyInvitesApi(),
      ]);
      setGroups(groupsRes.data.groups || []);
      setInviteCount(invitesRes.data.invites?.length || 0);
    } catch (err) {
      console.log('Groups fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleCreate = async (data) => {
    const res = await createGroupApi(data);
    await fetchGroups();
    navigation.navigate('GroupDetail', { groupId: res.data.group._id });
  };

  const handleDelete = (groupId) => {
    Alert.alert(
      'Delete Group',
      'Delete this group and all its expenses?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroupApi(groupId);
              setGroups(prev => prev.filter(g => g._id !== groupId));
            } catch (err) {
              Alert.alert('Error', 'Failed to delete group');
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>👥 Groups</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity
            onPress={() => setInviteOpen(true)}
            style={styles.inviteBtn}
          >
            <Text style={styles.inviteBtnText}>📨</Text>
            {inviteCount > 0 && (
              <View style={styles.inviteBadge}>
                <Text style={styles.inviteBadgeText}>{inviteCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setCreateOpen(true)}
          >
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={groups}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchGroups(); }}
            colors={[COLORS.primary]}
          />
        }
        renderItem={({ item: group }) => {
          const status   = STATUS_COLORS[group.status] || STATUS_COLORS.active;
          const emoji    = CATEGORY_EMOJIS[group.tripCategory] || '👥';
          const isCreator = group.isCreator;

          return (
            <TouchableOpacity
              style={styles.groupCard}
              onPress={() => navigation.navigate('GroupDetail', { groupId: group._id })}
              activeOpacity={0.8}
            >
              <View style={styles.groupCardLeft}>
                <View style={styles.groupEmoji}>
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </View>
                <View style={styles.groupInfo}>
                  <View style={styles.groupNameRow}>
                    <Text style={styles.groupName} numberOfLines={1}>
                      {group.name}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.text }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
                  {!isCreator && (
                    <View style={styles.sharedBadge}>
                      <Text style={styles.sharedText}>👥 Shared with me</Text>
                    </View>
                  )}
                  <Text style={styles.groupMeta}>
                    {group.members?.length || 0} members · {group.expenseCount || 0} expenses
                  </Text>
                  <Text style={styles.groupTotal}>
                    {fmt(group.totalAmount || 0)}
                  </Text>
                </View>
              </View>

              {isCreator && (
                <TouchableOpacity
                  onPress={() => handleDelete(group._id)}
                  style={styles.deleteBtn}
                >
                  <Text style={{ fontSize: 16 }}>🗑️</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 52 }}>👥</Text>
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySub}>
              Create a group for your next trip or shared expense
            </Text>
            <Button
              title="Create Group"
              onPress={() => setCreateOpen(true)}
              style={{ marginTop: 16 }}
            />
          </View>
        )}
      />

      <CreateGroupModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        user={user}
      />

      <InvitesModal
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onRefresh={fetchGroups}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },

  groupHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 20 },
  groupTitle:   { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  headerBtns:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inviteBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  inviteBtnText:{ fontSize: 18 },
  inviteBadge:  { position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.danger, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  inviteBadgeText: { fontSize: 10, color: COLORS.white, fontWeight: '700' },
  addBtn:       { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText:   { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  groupCard:    { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  groupCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  groupEmoji:   { width: 52, height: 52, backgroundColor: COLORS.primaryLight, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  groupInfo:    { flex: 1 },
  groupNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  groupName:    { fontSize: 15, fontWeight: '700', color: COLORS.dark, flex: 1 },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText:   { fontSize: 10, fontWeight: '600' },
  sharedBadge:  { backgroundColor: '#f3e8ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  sharedText:   { fontSize: 10, color: '#7c3aed', fontWeight: '600' },
  groupMeta:    { fontSize: 11, color: COLORS.gray, marginBottom: 2 },
  groupTotal:   { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  deleteBtn:    { padding: 10 },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyText:  { fontSize: 18, fontWeight: '700', color: COLORS.dark, marginTop: 16 },
  emptySub:   { fontSize: 13, color: COLORS.gray, marginTop: 8, textAlign: 'center' },

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
  chip:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.lightGray, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  chipSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  chipIcon:     { fontSize: 14, marginRight: 4 },
  chipText:     { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  chipTextSelected: { color: COLORS.primary, fontWeight: '700' },
  creatorBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, borderRadius: 12, padding: 12, marginBottom: 12 },
  creatorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, color: COLORS.white, fontSize: 16, fontWeight: '700', textAlign: 'center', lineHeight: 36, marginRight: 12 },
  creatorName:  { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  creatorLabel: { fontSize: 11, color: COLORS.primary },
  memberBlock:    { marginBottom: 4 },
  memberInputRow: { flexDirection: 'row', alignItems: 'center' },
  removeMemberBtn: { padding: 12, backgroundColor: '#fef2f2', borderRadius: 10 },
  addMemberBtn: { borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 20 },
  addMemberText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  modalBtns:    { flexDirection: 'row', marginBottom: 20 },
  inviteCard:   { backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 14, marginBottom: 12 },
  inviteName:   { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  inviteBy:     { fontSize: 12, color: COLORS.gray, marginBottom: 12 },
  inviteBtns:   { flexDirection: 'row' },
});

export default GroupsScreen;