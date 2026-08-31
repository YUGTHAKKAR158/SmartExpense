import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider }    from './src/context/AuthContext';
import AppNavigator        from './src/navigation/AppNavigator';
import { COLORS }          from './src/utils/constants';

const App = () => {

  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Main app */}
      <AppNavigator />

    </AuthProvider>
  );
};

export default App;