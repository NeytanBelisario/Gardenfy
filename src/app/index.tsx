import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '../components/shell/AppHeader';
import { AppNavbar } from '../components/shell/AppNavbar';

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader mode="menu" />
      <View style={styles.content} />
      <AppNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fbf9f5',
  },
  content: {
    flex: 1,
  },
});
