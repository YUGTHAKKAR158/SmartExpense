// ═══════════════════════════════════════════════
// src/screens/receipts/ReceiptScannerScreen.js
// ═══════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, TextInput, Modal, FlatList,
  Alert, Platform,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { COLORS, CATEGORIES, PAYMENT_METHODS } from '../../utils/constants';
import { scanReceiptApi }  from '../../api/receiptApi';
import { createExpenseApi } from '../../api/expenseApi';
import Card from '../../components/common/Card';

const IMAGE_PICKER_OPTIONS = {
  mediaType: 'photo',
  quality:   0.85,
  maxWidth:  1600,
  maxHeight: 2400,
};

// ── Small picker modal reused for Category and Payment ──
const PickerModal = ({ visible, title, items, selected, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
      <View style={styles.modalSheet}>
        <Text style={styles.modalTitle}>{title}</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.modalItem, item === selected && styles.modalItemSelected]}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text style={[styles.modalItemText, item === selected && styles.modalItemTextSelected]}>
                {item}
              </Text>
              {item === selected && <Text style={styles.modalCheck}>✓</Text>}
            </TouchableOpacity>
          )}
        />
      </View>
    </TouchableOpacity>
  </Modal>
);

// ── Main screen ──────────────────────────────────
const ReceiptScannerScreen = () => {
  // image picked by the user
  const [image,   setImage]   = useState(null);
  // OCR in progress
  const [scanning, setScanning] = useState(false);
  // OCR returned data — triggers review form
  const [scanned, setScanned]  = useState(false);
  // saving the expense
  const [saving,  setSaving]   = useState(false);
  const [error,   setError]    = useState('');

  // Editable form fields
  const [amount,        setAmount]        = useState('');
  const [merchant,      setMerchant]      = useState('');
  const [date,          setDate]          = useState('');
  const [category,      setCategory]      = useState('Other');
  const [paymentMethod, setPaymentMethod] = useState('Other');

  // Picker modal visibility
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showPayPicker, setShowPayPicker] = useState(false);

  // ── Image picker ──────────────────────────────
  const pickImage = (source) => {
    setError('');
    const launch = source === 'camera' ? launchCamera : launchImageLibrary;
    launch(IMAGE_PICKER_OPTIONS, (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (asset) {
        setImage(asset);
        setScanned(false);
        setAmount('');
        setMerchant('');
        setDate('');
        setCategory('Other');
        setPaymentMethod('Other');
      }
    });
  };

  // ── OCR scan ─────────────────────────────────
  const handleScan = async () => {
    if (!image) return;
    setScanning(true);
    setError('');
    try {
      const res = await scanReceiptApi(image);
      const data = res.data?.data;

      setAmount(data.amount != null ? String(data.amount) : '');
      setMerchant(data.merchant  || '');
      setDate(data.date          || '');
      setCategory(data.category  || 'Other');
      setPaymentMethod(data.paymentMethod || 'Other');
      setScanned(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Scan failed. Please try again.';
      setError(msg);
    } finally {
      setScanning(false);
    }
  };

  // ── Save expense ──────────────────────────────
  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!merchant.trim()) {
      setError('Please enter a merchant / description.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await createExpenseApi({
        amount:        parsedAmount,
        description:   merchant.trim(),
        merchant:      merchant.trim(),
        category,
        paymentMethod,
        date:          date || new Date().toISOString().split('T')[0],
        source:        'receipt_scan',
      });

      Alert.alert(
        'Expense Added',
        `₹${parsedAmount.toFixed(2)} from ${merchant.trim()} saved successfully.`,
        [{
          text: 'Scan Another',
          onPress: () => {
            setImage(null);
            setScanned(false);
            setAmount('');
            setMerchant('');
            setDate('');
            setCategory('Other');
            setPaymentMethod('Other');
          },
        }],
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not save expense. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📷 Scan Receipt</Text>
        <Text style={styles.subtitle}>
          Take a photo of your receipt — we'll extract the details automatically.
        </Text>
      </View>

      {/* ── No image yet ── */}
      {!image && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyText}>No receipt selected</Text>
          <Text style={styles.emptyHint}>
            Choose a clear, well-lit photo for best results.
          </Text>
          <View style={styles.pickRow}>
            <TouchableOpacity
              style={[styles.pickBtn, { backgroundColor: COLORS.primary }]}
              onPress={() => pickImage('camera')}
            >
              <Text style={styles.pickBtnText}>📷  Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickBtn, { backgroundColor: COLORS.dark }]}
              onPress={() => pickImage('gallery')}
            >
              <Text style={styles.pickBtnText}>🖼️  Gallery</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* ── Image preview ── */}
      {image && (
        <Card style={styles.previewCard}>
          <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="contain" />

          {/* Scanning overlay */}
          {scanning && (
            <View style={styles.scanOverlay}>
              <ActivityIndicator size="large" color={COLORS.white} />
              <Text style={styles.scanOverlayText}>Reading receipt…</Text>
              <Text style={styles.scanOverlayHint}>This may take 15–30 seconds</Text>
            </View>
          )}

          {/* Change image link */}
          {!scanning && (
            <View style={styles.changeRow}>
              <TouchableOpacity onPress={() => pickImage('camera')}>
                <Text style={styles.changeLink}>📷 Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => pickImage('gallery')}>
                <Text style={styles.changeLink}>🖼️ Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>
      )}

      {/* Error banner */}
      {!!error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️  {error}</Text>
        </Card>
      )}

      {/* ── Scan button (before results) ── */}
      {image && !scanned && !scanning && (
        <TouchableOpacity style={styles.scanBtn} onPress={handleScan}>
          <Text style={styles.scanBtnText}>🔍  Scan Receipt</Text>
        </TouchableOpacity>
      )}

      {/* ── Review form (after scan) ── */}
      {scanned && (
        <>
          <Card style={styles.successBanner}>
            <Text style={styles.successText}>✅  Receipt scanned — review and confirm</Text>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Extracted Details</Text>

            {/* Amount */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Amount (₹) *</Text>
              <TextInput
                style={styles.fieldInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            {/* Merchant */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Merchant / Description *</Text>
              <TextInput
                style={styles.fieldInput}
                value={merchant}
                onChangeText={setMerchant}
                placeholder="Where did you spend?"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            {/* Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.fieldInput}
                value={date}
                onChangeText={setDate}
                placeholder="2024-01-15"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            {/* Category picker */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowCatPicker(true)}
              >
                <Text style={styles.pickerBtnText}>{category}</Text>
                <Text style={styles.pickerChevron}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Payment method picker */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Payment Method</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowPayPicker(true)}
              >
                <Text style={styles.pickerBtnText}>{paymentMethod}</Text>
                <Text style={styles.pickerChevron}>›</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.saveBtnText}>✅  Add Expense</Text>
            }
          </TouchableOpacity>

          {/* Rescan button */}
          <TouchableOpacity style={styles.rescanBtn} onPress={handleScan} disabled={scanning}>
            <Text style={styles.rescanBtnText}>🔄  Re-scan</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />

      {/* Category picker modal */}
      <PickerModal
        visible={showCatPicker}
        title="Select Category"
        items={CATEGORIES}
        selected={category}
        onSelect={setCategory}
        onClose={() => setShowCatPicker(false)}
      />

      {/* Payment method picker modal */}
      <PickerModal
        visible={showPayPicker}
        title="Select Payment Method"
        items={PAYMENT_METHODS}
        selected={paymentMethod}
        onSelect={setPaymentMethod}
        onClose={() => setShowPayPicker(false)}
      />
    </ScrollView>
  );
};

// ── Styles ────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { padding: 16, paddingBottom: 32 },

  header: { marginBottom: 16, paddingTop: 8 },
  title:  { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  subtitle: { fontSize: 13, color: COLORS.gray, marginTop: 4, lineHeight: 18 },

  // Empty state
  emptyCard: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginTop: 12 },
  emptyHint: { fontSize: 12, color: COLORS.gray, marginTop: 6, textAlign: 'center' },
  pickRow:   { flexDirection: 'row', gap: 12, marginTop: 20 },
  pickBtn:   { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  pickBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  // Image preview
  previewCard: { padding: 0, overflow: 'hidden' },
  preview:     { width: '100%', height: 280, backgroundColor: COLORS.lightGray },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanOverlayText: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginTop: 14 },
  scanOverlayHint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 6 },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    padding: 10,
    backgroundColor: COLORS.white,
  },
  changeLink: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  // Error / success banners
  errorCard:   { backgroundColor: '#fef2f2', borderLeftWidth: 3, borderLeftColor: COLORS.danger },
  errorText:   { color: COLORS.danger, fontSize: 13 },
  successBanner: { backgroundColor: '#f0fdf4', borderLeftWidth: 3, borderLeftColor: COLORS.success },
  successText:   { color: COLORS.success, fontSize: 13, fontWeight: '600' },

  // Scan button
  scanBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  scanBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  // Review form
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 14 },
  fieldGroup:   { marginBottom: 16 },
  fieldLabel:   { fontSize: 12, color: COLORS.gray, fontWeight: '600', marginBottom: 6 },
  fieldInput:   {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  pickerBtnText:  { fontSize: 15, color: COLORS.dark },
  pickerChevron:  { fontSize: 20, color: COLORS.gray },

  // Save / rescan
  saveBtn: {
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  rescanBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  rescanBtnText: { color: COLORS.gray, fontSize: 14, fontWeight: '600' },

  // Picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalItemSelected:     { backgroundColor: COLORS.primaryLight },
  modalItemText:         { fontSize: 15, color: COLORS.dark },
  modalItemTextSelected: { color: COLORS.primary, fontWeight: '700' },
  modalCheck:            { fontSize: 16, color: COLORS.primary },
});

export default ReceiptScannerScreen;
