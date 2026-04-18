import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  background: '#fbf9f5',
  primary: '#17361d',
  surfaceHigh: '#eae8e4',
} as const;

type AppHeaderProps = {
  title?: string;
  mode?: 'menu' | 'back';
  onPressLeading?: () => void;
};

export function AppHeader({
  title = 'Gardenfy',
  mode = 'menu',
  onPressLeading,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 4,
        },
      ]}
    >
      <View style={styles.headerLeft}>
        <Pressable style={styles.headerIconButton} onPress={onPressLeading}>
          <Ionicons
            name={mode === 'back' ? 'arrow-back' : 'menu'}
            size={24}
            color={COLORS.primary}
          />
        </Pressable>

        <Text style={styles.headerBrand}>{title}</Text>
      </View>

      <View style={styles.avatarWrap}>
        <Image
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwOyh-buZyXwz8iCwvsWwz6UuFJNXRIYTcsS4-qoh9svR-O4PWE9G3Iqy9pReXWaZKJiMGTPLxNCVjJa06nb7kvtn29WhvbxC0I8uD86wRK8Mjwm2BuXBpher69cIxWJv0JiLYNe_WzPgBv7tfpKT3oIwvuehEjWJaaO5odL3IZzHIuzRCHitvRAOFp4GXW8FwzjzxrkkHW5kP1SG_JIVZZtV-pQ19yhT54ryelHwEMwuacwKWg8LHlkoiE6yExoq30DxN-WMUthg',
          }}
          style={styles.avatar}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(251, 249, 245, 0.76)',
    paddingHorizontal: 18,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceHigh,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});
