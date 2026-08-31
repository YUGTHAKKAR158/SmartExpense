import React, { useState } from 'react';
import {
  View, Text, TextInput,
  StyleSheet, TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  editable = true,
  multiline = false,
  numberOfLines,
  style,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused,    setIsFocused]    = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      <View style={[
        styles.inputWrapper,
        isFocused && styles.focused,
        error && styles.errorBorder,
        !editable && styles.disabled,
      ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            multiline && styles.multiline,
          ]}
        />

        {/* Password visibility toggle */}
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeText}>
              {showPassword ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize:     13,
    fontWeight:   '600',
    color:        COLORS.dark,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection:   'row',
    alignItems:      'center',
    borderWidth:     1.5,
    borderColor:     COLORS.border,
    borderRadius:    12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
  },
  focused: {
    borderColor: COLORS.primary,
  },
  errorBorder: {
    borderColor: COLORS.danger,
  },
  disabled: {
    backgroundColor: COLORS.lightGray,
  },
  input: {
    flex:      1,
    height:    48,
    fontSize:  15,
    color:     COLORS.dark,
  },
  multiline: {
    height:    100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  eyeButton: {
    padding: 8,
  },
  eyeText: {
    fontSize: 16,
  },
  errorText: {
    fontSize:  12,
    color:     COLORS.danger,
    marginTop: 4,
  },
});

export default Input;