// ═══════════════════════════════════════════════
// src/components/common/Button.js
// ═══════════════════════════════════════════════

import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, View,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const bgColor = {
    primary:   COLORS.primary,
    secondary: COLORS.white,
    danger:    COLORS.danger,
    outline:   'transparent',
  }[variant];

  const textColor = {
    primary:   COLORS.white,
    secondary: COLORS.dark,
    danger:    COLORS.white,
    outline:   COLORS.primary,
  }[variant];

  const borderColor = variant === 'outline' || variant === 'secondary'
    ? COLORS.border
    : 'transparent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        { backgroundColor: bgColor, borderColor, borderWidth: 1 },
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={textColor}
          size="small"
        />
      ) : (
        <Text style={[styles.text, { color: textColor }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height:         48,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  text: {
    fontSize:   15,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;