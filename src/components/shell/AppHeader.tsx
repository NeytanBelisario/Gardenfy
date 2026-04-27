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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { currentUser, getUserInitial } from '../../features/user/profile';
import { setShellMenuOpen, useShellUi } from './shellUiStore';

const COLORS = {
  primary: '#17361d',
  surfaceHigh: '#eae8e4',
  surfaceLow: '#f5f3ef',
  textMuted: '#6b7469',
  white: '#ffffff',
  overlay: 'rgba(8, 18, 10, 0.22)',
  tertiarySoft: '#ffcfab',
} as const;

type AppHeaderProps = {
  title?: string;
  mode?: 'menu' | 'back';
  onPressLeading?: () => void;
};

const menuItems = [
  { label: 'Meus jardins', icon: 'leaf-outline', route: '/' },
  { label: 'Escanear planta', icon: 'scan-outline', route: '/scan' },
  { label: 'Preview AR', icon: 'cube-outline', route: '/preview' },
  { label: 'Criar jardim', icon: 'add-circle-outline', route: '/gardens/new' },
] as const;

export function AppHeader({
  title = 'Gardenfy',
  mode = 'menu',
  onPressLeading,
}: AppHeaderProps) {
  const router = useRouter();
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
            <View style={styles.drawerProfileCard}>
              <View style={styles.drawerAvatar}>
                <Text style={styles.drawerAvatarText}>{userInitial}</Text>
              </View>
              <View style={styles.drawerCopy}>
                <Text style={styles.drawerName}>{currentUser.name}</Text>
                <Text style={styles.drawerRole}>{currentUser.role}</Text>
                <Text style={styles.drawerEmail}>{currentUser.email}</Text>
              </View>
            </View>

            <View style={styles.drawerSection}>
              {menuItems.map((item) => (
                <Pressable
                  key={item.route}
                  style={styles.drawerItem}
                  onPress={() => handleNavigate(item.route)}
                >
                  <View style={styles.drawerItemIcon}>
                    <Ionicons name={item.icon} size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.drawerItemText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.drawerFooter}>
              <Text style={styles.drawerFooterTitle}>Em breve</Text>
              <Text style={styles.drawerFooterText}>
                Perfil, tarefas e ajustes do app entram no proximo passo.
              </Text>
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

        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{userInitial}</Text>
        </View>
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
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingBottom: 28,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 6, height: 0 },
    elevation: 24,
  },
  drawerProfileCard: {
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
  },
  drawerAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.tertiarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerAvatarText: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  drawerCopy: {
    flex: 1,
    gap: 3,
  },
  drawerName: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '900',
  },
  drawerRole: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    fontWeight: '700',
  },
  drawerEmail: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    fontWeight: '600',
  },
  drawerSection: {
    marginTop: 24,
    gap: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLow,
  },
  drawerItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItemText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  drawerFooter: {
    marginTop: 'auto',
    borderRadius: 22,
    backgroundColor: COLORS.surfaceLow,
    padding: 16,
    gap: 6,
  },
  drawerFooterTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  drawerFooterText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
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
