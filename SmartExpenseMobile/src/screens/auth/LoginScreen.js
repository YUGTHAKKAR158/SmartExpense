// ═══════════════════════════════════════════════
// src/screens/auth/LoginScreen.js
// ═══════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth }  from '../../context/AuthContext';
import Button       from '../../components/common/Button';
import Input        from '../../components/common/Input';
import Alert        from '../../components/common/Alert';
import { COLORS }   from '../../utils/constants';

const LoginScreen = ({ navigation }) => {
  const { login }  = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const validate = () => {
    if (!email.trim())    { setError('Email is required');    return false; }
    if (!password)        { setError('Password is required'); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      // AuthContext updates → AppNavigator auto-switches to MainNavigator
    } catch (err) {
      const message = err.response?.data?.message ||
                      err.message ||
                      'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>💰</Text>
          <Text style={styles.title}>SmartExpense</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Alert
            message={error}
            type="error"
            onDismiss={() => setError('')}
          />

          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <Button
            title={loading ? 'Signing in...' : 'Sign In'}
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text style={styles.registerHighlight}>Create one free</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow:       1,
    justifyContent: 'center',
    padding:        24,
  },
  header: {
    alignItems:   'center',
    marginBottom: 40,
  },
  logo: {
    fontSize:     64,
    marginBottom: 12,
  },
  title: {
    fontSize:     28,
    fontWeight:   '800',
    color:        COLORS.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color:    COLORS.gray,
  },
  form: {
    backgroundColor: COLORS.white,
    borderRadius:    20,
    padding:         24,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.08,
    shadowRadius:    12,
    elevation:       5,
  },
  loginBtn: {
    marginTop: 8,
  },
  registerLink: {
    alignItems: 'center',
    marginTop:  20,
  },
  registerText: {
    fontSize: 14,
    color:    COLORS.gray,
  },
  registerHighlight: {
    color:      COLORS.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;