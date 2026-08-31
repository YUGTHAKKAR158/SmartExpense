import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';

const Alert = ({ message, type = 'error', onDismiss }) => {
  if (!message) return null;

  const config = {
    error:   { bg: '#fef2f2', border: COLORS.danger,  text: '#991b1b', icon: '❌' },
    success: { bg: '#f0fdf4', border: COLORS.success,  text: '#166534', icon: '✅' },
    warning: { bg: '#fffbeb', border: COLORS.warning,  text: '#92400e', icon: '⚠️' },
    info:    { bg: '#eff6ff', border: COLORS.primary,  text: '#1e40af', icon: 'ℹ️' },
  }[type] || {};

  return (
    <View style={[
      styles.container,
      { backgroundColor: config.bg, borderLeftColor: config.border },
    ]}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.message, { color: config.text }]}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismiss}>
          <Text style={{ color: config.text, fontSize: 18 }}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    padding:        12,
    borderRadius:   10,
    borderLeftWidth: 4,
    marginBottom:   16,
  },
  icon: {
    fontSize:    16,
    marginRight: 8,
    marginTop:   1,
  },
  message: {
    flex:       1,
    fontSize:   13,
    fontWeight: '500',
    lineHeight: 20,
  },
  dismiss: {
    marginLeft: 8,
    padding:    2,
  },
});

export default Alert;