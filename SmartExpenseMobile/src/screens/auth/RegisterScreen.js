import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';
const ReportsScreen = () => (
  <View style={styles.c}>
    <Text style={styles.t}>📄 Reports</Text>
  </View>
);
const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  t: { fontSize: 24, fontWeight: '700', color: COLORS.dark },
});
export default ReportsScreen;