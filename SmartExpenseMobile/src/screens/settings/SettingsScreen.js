import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const CURRENCIES = [
  { code: 'INR', label: '₹ Indian Rupee' },
  { code: 'USD', label: '$ US Dollar' },
  { code: 'EUR', label: '€ Euro' },
  { code: 'GBP', label: '£ British Pound' },
];

export default function SettingsScreen({ navigation }) {
  const { user, updateUser, logout } = useAuth();

  const [name, setName]                   = useState(user?.name || '');
  const [currency, setCurrency]           = useState(user?.currency || 'INR');
  const [currentPassword, setCurrentPwd] = useState('');
  const [newPassword, setNewPwd]          = useState('');
  const [confirmPassword, setConfirmPwd] = useState('');
  const [saving, setSaving]               = useState(false);

  const isLocal = user?.authProvider === 'local' || !user?.authProvider;

  const handleSave = async () => {
    if (name.trim().length < 2) {
      Alert.alert('Invalid Name', 'Name must be at least 2 characters.');
      return;
    }

    const payload = { name: name.trim(), currency };

    if (newPassword) {
      if (!isLocal) {
        Alert.alert('Not Allowed', 'SSO accounts cannot change password here.');
        return;
      }
      if (!currentPassword) {
        Alert.alert('Missing Field', 'Please enter your current password.');
        return;
      }
      if (newPassword.length < 6) {
        Alert.alert('Weak Password', 'New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert('Mismatch', 'New passwords do not match.');
        return;
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    try {
      setSaving(true);
      await updateUser(payload);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>Profile</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor="#9ca3af"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Currency</Text>
      <View style={styles.currencyRow}>
        {CURRENCIES.map(c => (
          <TouchableOpacity
            key={c.code}
            style={[styles.currencyChip, currency === c.code && styles.currencyChipActive]}
            onPress={() => setCurrency(c.code)}
          >
            <Text style={[styles.currencyChipText, currency === c.code && styles.currencyChipTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLocal && (
        <>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <Text style={styles.hint}>Leave blank to keep current password.</Text>

          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPwd}
            placeholder="Current password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />

          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPwd}
            placeholder="New password (min 6 chars)"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />

          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPwd}
            placeholder="Repeat new password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />
        </>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>Save Changes</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f3f4f6' },
  content:     { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24, marginBottom: 10 },
  hint:        { fontSize: 12, color: '#9ca3af', marginBottom: 8, marginTop: -6 },
  label:       { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input:       { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#111827', marginBottom: 16 },
  currencyRow: { flexDirection: 'column', gap: 8, marginBottom: 16 },
  currencyChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  currencyChipActive: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  currencyChipText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  currencyChipTextActive: { color: '#6366f1', fontWeight: '700' },
  saveBtn:     { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 12 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  logoutBtn:   { borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
});
