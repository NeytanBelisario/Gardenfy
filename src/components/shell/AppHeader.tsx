import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { currentUser, getUserInitial } from '../../features/user/profile';
import { setShellMenuOpen, useShellUi } from './shellUiStore';

const COLORS = {
  primary: '#17361d',
  secondary: '#476644',
  surface: '#fbf9f5',
  surfaceContainer: '#f0eeea',
  surfaceHigh: '#eae8e4',
  surfaceLow: '#f5f3ef',
  surfaceMuted: '#e4e2de',
  textMuted: '#6b7469',
  white: '#ffffff',
  overlay: 'rgba(8, 18, 10, 0.24)',
  tertiarySoft: '#ffcfab',
} as const;

type AppHeaderProps = {
  title?: string;
  mode?: 'menu' | 'back';
  onPressLeading?: () => void;
};

const menuItems = [
  { label: 'Home', icon: 'home-outline', route: '/' },
  { label: 'Jardins', icon: 'leaf-outline', route: '/gardens' },
  { label: 'Scan', icon: 'scan-outline', route: '/scan' },
  { label: 'Preview AR', icon: 'cube-outline', route: '/preview' },
  { label: 'Criar jardim', icon: 'add-circle-outline', route: '/gardens/new' },
] as const;

export function AppHeader({
  title = 'Gardenfy',
  mode = 'menu',
  onPressLeading,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { menuOpen } = useShellUi();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const userInitial = useMemo(() => getUserInitial(currentUser.name), []);
  const drawerWidth = Math.min(width * 0.82, 340);
  const drawerTranslateX = useRef(new Animated.Value(-drawerWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!drawerVisible && !menuOpen) {
      drawerTranslateX.setValue(-drawerWidth);
      overlayOpacity.setValue(0);
    }
  }, [drawerTranslateX, drawerVisible, drawerWidth, menuOpen, overlayOpacity]);

  const animateOpen = useCallback(() => {
    drawerTranslateX.stopAnimation();
    overlayOpacity.stopAnimation();
    setShellMenuOpen(true);
    setDrawerVisible(true);

    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(drawerTranslateX, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [drawerTranslateX, overlayOpacity]);

  const animateClose = useCallback((afterClose?: () => void) => {
    drawerTranslateX.stopAnimation();
    overlayOpacity.stopAnimation();

    Animated.parallel([
      Animated.timing(drawerTranslateX, {
        toValue: -drawerWidth,
        duration: 210,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerVisible(false);
      setShellMenuOpen(false);
      afterClose?.();
    });
  }, [drawerTranslateX, drawerWidth, overlayOpacity]);

  const edgeSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => mode === 'menu' && !drawerVisible,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          mode === 'menu' &&
          !drawerVisible &&
          gestureState.dx > 8 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderGrant: () => {
          setShellMenuOpen(true);
          setDrawerVisible(true);
          drawerTranslateX.setValue(-drawerWidth);
          overlayOpacity.setValue(0);
        },
        onPanResponderMove: (_, gestureState) => {
          const progress = Math.max(0, Math.min(1, gestureState.dx / drawerWidth));
          drawerTranslateX.setValue(-drawerWidth + drawerWidth * progress);
          overlayOpacity.setValue(progress);
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldOpen = gestureState.dx > drawerWidth * 0.35 || gestureState.vx > 0.6;

          if (shouldOpen) {
            animateOpen();
            return;
          }

          animateClose();
        },
        onPanResponderTerminate: () => {
          animateClose();
        },
      }),
    [
      animateClose,
      animateOpen,
      drawerTranslateX,
      drawerVisible,
      drawerWidth,
      mode,
      overlayOpacity,
    ]
  );

  const drawerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          drawerVisible &&
          gestureState.dx < -8 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderMove: (_, gestureState) => {
          const clampedDx = Math.max(-drawerWidth, Math.min(0, gestureState.dx));
          const progress = 1 - Math.abs(clampedDx) / drawerWidth;
          drawerTranslateX.setValue(clampedDx);
          overlayOpacity.setValue(progress);
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldClose =
            gestureState.dx < -drawerWidth * 0.28 || gestureState.vx < -0.55;

          if (shouldClose) {
            animateClose();
            return;
          }

          animateOpen();
        },
        onPanResponderTerminate: () => {
          animateOpen();
        },
      }),
    [animateClose, animateOpen, drawerTranslateX, drawerVisible, drawerWidth, overlayOpacity]
  );

  const handleLeadingPress = () => {
    if (mode === 'menu') {
      drawerTranslateX.setValue(-drawerWidth);
      overlayOpacity.setValue(0);
      animateOpen();
      return;
    }

    onPressLeading?.();
  };

  const handleCloseMenu = () => {
    animateClose();
  };

  const handleNavigate = (route: (typeof menuItems)[number]['route']) => {
    animateClose(() => router.push(route as never));
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  return (
    <>
      {mode === 'menu' ? (
        <View style={styles.edgeSwipeZone} {...edgeSwipeResponder.panHandlers} />
      ) : null}

      <Modal
        transparent
        visible={drawerVisible}
        animationType="none"
        onRequestClose={handleCloseMenu}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.drawerBackdrop, { opacity: overlayOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseMenu} />
          </Animated.View>
          <Animated.View
            {...drawerPanResponder.panHandlers}
            style={[
              styles.drawer,
              {
                width: drawerWidth,
                paddingTop: insets.top + 20,
                transform: [{ translateX: drawerTranslateX }],
              },
            ]}
          >
            <View style={styles.drawerProfile}>
              <View style={styles.drawerAvatarWrap}>
                <View style={styles.drawerAvatar}>
                  <Text style={styles.drawerAvatarText}>{userInitial}</Text>
                </View>
                <View style={styles.drawerVerifiedBadge}>
                  <Ionicons name="checkmark" size={14} color={COLORS.primary} />
                </View>
              </View>
              <View style={styles.drawerCopy}>
                <Text style={styles.drawerName}>{currentUser.name}</Text>
                <Text style={styles.drawerRole}>{currentUser.role}</Text>
              </View>

              <View style={styles.drawerStatsBadge}>
                <Ionicons name="flower-outline" size={18} color={COLORS.primary} />
                <Text style={styles.drawerStatsText}>Gardenfy workspace</Text>
              </View>
            </View>

            <View style={styles.drawerSection}>
              {menuItems.map((item) => {
                const isActive =
                  pathname === item.route ||
                  (item.route === '/gardens' && pathname.startsWith('/gardens/'));

                return (
                  <Pressable
                    key={item.route}
                    style={({ pressed }) => [
                      styles.drawerItem,
                      isActive && styles.drawerItemActive,
                      pressed && styles.drawerItemPressed,
                    ]}
                    onPress={() => handleNavigate(item.route)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={24}
                      color={isActive ? COLORS.primary : COLORS.secondary}
                    />
                    <Text style={[styles.drawerItemText, isActive && styles.drawerItemTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.drawerFooter}>
              <View style={styles.drawerFooterCopy}>
                <Text style={styles.drawerFooterTitle}>Pro Gardenfy</Text>
                <Text style={styles.drawerFooterText}>
                  Unlock advanced plant care and garden automation.
                </Text>
              </View>
              <View style={styles.drawerFooterButton}>
                <Text style={styles.drawerFooterButtonText}>Upgrade now</Text>
              </View>
              <Ionicons
                name="leaf-outline"
                size={82}
                color="rgba(255,255,255,0.08)"
                style={styles.drawerFooterLeaf}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>

      <View
        pointerEvents={drawerVisible ? 'none' : 'auto'}
        style={[
          styles.header,
          {
            paddingTop: insets.top + 4,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Pressable style={styles.headerIconButton} onPress={handleLeadingPress}>
            <Ionicons
              name={mode === 'back' ? 'arrow-back' : 'menu'}
              size={24}
              color={COLORS.primary}
            />
          </Pressable>

          <Text style={styles.headerBrand}>{title}</Text>
        </View>

        <Pressable style={styles.avatarWrap} onPress={handleProfilePress}>
          <Text style={styles.avatarText}>{userInitial}</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  edgeSwipeZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 24,
    zIndex: 30,
    elevation: 30,
  },
  modalRoot: {
    flex: 1,
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 40,
    shadowOffset: { width: 18, height: 0 },
    elevation: 24,
  },
  drawerProfile: {
    paddingTop: 12,
    paddingBottom: 22,
    gap: 14,
  },
  drawerAvatarWrap: {
    width: 74,
    height: 74,
  },
  drawerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: COLORS.surfaceContainer,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerAvatarText: {
    color: COLORS.primary,
    fontSize: 29,
    fontWeight: '900',
  },
  drawerVerifiedBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: COLORS.surface,
    backgroundColor: COLORS.tertiarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCopy: {
    gap: 5,
  },
  drawerName: {
    color: COLORS.primary,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  drawerRole: {
    color: COLORS.secondary,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500',
  },
  drawerStatsBadge: {
    alignSelf: 'flex-start',
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(27, 28, 26, 0.06)',
    backgroundColor: COLORS.surfaceLow,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerStatsText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  drawerSection: {
    flex: 1,
    gap: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: 18,
  },
  drawerItemActive: {
    backgroundColor: 'rgba(71, 102, 68, 0.1)',
  },
  drawerItemPressed: {
    opacity: 0.82,
    transform: [{ translateX: 2 }],
  },
  drawerItemText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  drawerItemTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  drawerFooter: {
    marginTop: 14,
    minHeight: 128,
    borderRadius: 28,
    backgroundColor: '#2e4d32',
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  drawerFooterCopy: {
    gap: 6,
  },
  drawerFooterTitle: {
    color: COLORS.white,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '900',
  },
  drawerFooterText: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 190,
  },
  drawerFooterButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: COLORS.tertiarySoft,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  drawerFooterButtonText: {
    color: '#301400',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  drawerFooterLeaf: {
    position: 'absolute',
    right: -14,
    bottom: -22,
    transform: [{ rotate: '12deg' }],
  },
  header: {
    backgroundColor: 'rgba(251, 249, 245, 0.76)',
    paddingHorizontal: 18,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 1,
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
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '900',
  },
});
