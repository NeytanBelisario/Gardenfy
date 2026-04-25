import React, { useCallback, useMemo, useRef, useState } from 'react';
import { NativeModules, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import Constants from 'expo-constants';
import {
  ViroAmbientLight,
  Viro3DObject,
  ViroARPlaneSelector,
  ViroARScene,
  ViroARSceneNavigator,
  ViroDirectionalLight,
  ViroNode,
  ViroPinchStateTypes,
  ViroRotateStateTypes,
  ViroTrackingStateConstants,
  isARSupportedOnDevice,
} from '@reactvision/react-viro';

import { AppHeader } from '../../components/shell/AppHeader';

const PLANT_MODEL = require('../../public/fiddle-leaf-plant.glb');
const INITIAL_SCALE = 0.12;
const MIN_SCALE = 0.05;
const MAX_SCALE = 0.35;

type SupportStatus = 'checking' | 'ready' | 'unsupported' | 'native-misaligned';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hasFabricRuntime() {
  const runtime = globalThis as typeof globalThis & {
    nativeFabricUIManager?: unknown;
    __turboModuleProxy?: unknown;
  };

  return Boolean(runtime.nativeFabricUIManager || runtime.__turboModuleProxy);
}

function hasViroNativeBindings() {
  const hasNavigatorModule = Boolean(NativeModules.VRTARSceneNavigatorModule);
  const viewManagerConfig =
    typeof UIManager.getViewManagerConfig === 'function'
      ? UIManager.getViewManagerConfig('VRTARSceneNavigator')
      : (UIManager as typeof UIManager & { VRTARSceneNavigator?: unknown }).VRTARSceneNavigator;

  return hasNavigatorModule && Boolean(viewManagerConfig);
}

function PlantArScene() {
  const [isPlaced, setIsPlaced] = useState(false);
  const [trackingReady, setTrackingReady] = useState(false);
  const [scale, setScale] = useState(INITIAL_SCALE);
  const [rotationY, setRotationY] = useState(0);
  const [pinchStartScale, setPinchStartScale] = useState(INITIAL_SCALE);
  const [rotateStartY, setRotateStartY] = useState(0);
  const planeSelectorRef = useRef<ViroARPlaneSelector | null>(null);

  const handleTrackingUpdated = useCallback((state: number) => {
    setTrackingReady(state === ViroTrackingStateConstants.TRACKING_NORMAL);
  }, []);

  const handlePlaneSelected = useCallback(() => {
    setIsPlaced(true);
  }, []);

  const handlePinch = useCallback((pinchState: number, scaleFactor: number) => {
    if (pinchState === ViroPinchStateTypes.PINCH_START) {
      setPinchStartScale(scale);
      return;
    }

    const nextScale = clamp(pinchStartScale * scaleFactor, MIN_SCALE, MAX_SCALE);
    setScale(nextScale);
  }, [pinchStartScale, scale]);

  const handleRotate = useCallback((rotateState: number, rotationFactor: number) => {
    if (rotateState === ViroRotateStateTypes.ROTATE_START) {
      setRotateStartY(rotationY);
      return;
    }

    setRotationY(rotateStartY + rotationFactor);
  }, [rotateStartY, rotationY]);

  return (
    <ViroARScene
      anchorDetectionTypes={['PlanesHorizontal']}
      onTrackingUpdated={handleTrackingUpdated}
      onAnchorFound={(anchor) => planeSelectorRef.current?.handleAnchorFound(anchor)}
      onAnchorUpdated={(anchor) => planeSelectorRef.current?.handleAnchorUpdated(anchor)}
      onAnchorRemoved={(anchor) => {
        if (anchor) {
          planeSelectorRef.current?.handleAnchorRemoved(anchor);
        }
      }}
    >
      <ViroAmbientLight color="#ffffff" intensity={420} />
      <ViroDirectionalLight
        color="#fff7e8"
        direction={[-0.35, -1, -0.2]}
        intensity={850}
        castsShadow
      />

      <ViroARPlaneSelector
        ref={planeSelectorRef}
        key={trackingReady ? 'ready' : 'searching'}
        alignment="Horizontal"
        minHeight={0.15}
        minWidth={0.15}
        onPlaneSelected={handlePlaneSelected}
      >
        <ViroNode position={[0, 0.02, 0]}>
          <Viro3DObject
            source={PLANT_MODEL}
            type="GLB"
            position={[0, 0, 0]}
            rotation={[0, rotationY, 0]}
            scale={[scale, scale, scale]}
            onPinch={handlePinch}
            onRotate={handleRotate}
            visible={isPlaced && trackingReady}
          />
        </ViroNode>
      </ViroARPlaneSelector>
    </ViroARScene>
  );
}

export function PlantArScreen() {
  const [supportStatus, setSupportStatus] = useState<SupportStatus>(
    Platform.OS === 'web' ? 'unsupported' : 'checking'
  );
  const [isGuideVisible, setIsGuideVisible] = useState(true);
  const arNavigatorRef = useRef<ViroARSceneNavigator | null>(null);

  React.useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    if (!hasFabricRuntime() || !hasViroNativeBindings()) {
      setSupportStatus('native-misaligned');
      return;
    }

    let mounted = true;

    isARSupportedOnDevice()
      .then((result) => {
        if (mounted) {
          setSupportStatus(result.isARSupported ? 'ready' : 'unsupported');
        }
      })
      .catch(() => {
        if (mounted) {
          setSupportStatus('unsupported');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const isExpoGo = Constants.appOwnership === 'expo';

  const helperCopy = useMemo(() => {
    if (Platform.OS === 'web') {
      return 'A experiencia AR precisa rodar em Android ou iOS.';
    }

    if (isExpoGo) {
      return 'Use um development build nativo, porque o Viro AR nao funciona no Expo Go.';
    }

    if (supportStatus === 'unsupported') {
      return 'Este dispositivo ou build atual nao oferece suporte a AR.';
    }

    if (supportStatus === 'native-misaligned') {
      return 'O build nativo instalado nao esta alinhado com a configuracao atual do Viro. Reinstale o app de development build para sincronizar o Android nativo.';
    }

    return 'Aponte a camera para o chao ou uma mesa, toque no plano e use dois dedos para girar e redimensionar.';
  }, [isExpoGo, supportStatus]);

  const canRenderAr = Platform.OS !== 'web' && !isExpoGo && supportStatus === 'ready';

  const handleReposition = useCallback(() => {
    arNavigatorRef.current?._resetARSession?.(true, true);
  }, []);

  return (
    <View style={styles.screen}>
      {canRenderAr ? (
        <ViroARSceneNavigator
          ref={arNavigatorRef}
          autofocus
          hdrEnabled
          pbrEnabled
          shadowsEnabled
          initialScene={{ scene: PlantArScene }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>Realidade aumentada indisponivel</Text>
          <Text style={styles.fallbackText}>{helperCopy}</Text>
        </View>
      )}

      <View pointerEvents="box-none" style={styles.overlay}>
        <View pointerEvents="box-none">
          <AppHeader mode="back" />

          {isGuideVisible ? (
            <View style={styles.topCard}>
              <View style={styles.topCardHeader}>
                <View style={styles.topCardCopy}>
                  <Text style={styles.eyebrow}>Plant Preview AR</Text>
                  <Text style={styles.title}>Posicione sua planta no ambiente</Text>
                </View>

                <Pressable
                  hitSlop={10}
                  onPress={() => setIsGuideVisible(false)}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.closeButtonText}>X</Text>
                </Pressable>
              </View>

              <Text style={styles.description}>{helperCopy}</Text>
            </View>
          ) : (
            <View style={styles.guideHintWrap} pointerEvents="box-none">
              <Pressable
                onPress={() => setIsGuideVisible(true)}
                style={({ pressed }) => [styles.guideHint, pressed && styles.buttonPressed]}
              >
                <Text style={styles.guideHintText}>Mostrar instrucoes</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View pointerEvents="box-none" style={styles.bottomDock}>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={handleReposition}
          >
            <Text style={styles.secondaryButtonText}>Reposicionar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0d1710',
  },
  fallback: {
    flex: 1,
    backgroundColor: '#16261a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackTitle: {
    color: '#f4f8ee',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  fallbackText: {
    marginTop: 12,
    color: '#d0dccd',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingBottom: 28,
  },
  topCard: {
    marginTop: 88,
    marginHorizontal: 20,
    alignSelf: 'stretch',
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(16, 29, 19, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(195, 220, 184, 0.2)',
  },
  topCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  topCardCopy: {
    flex: 1,
  },
  eyebrow: {
    color: '#b6d7a4',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    marginTop: 6,
    color: '#f5faef',
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    marginTop: 10,
    color: '#dce7d5',
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 249, 245, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251, 249, 245, 0.18)',
  },
  closeButtonText: {
    color: '#f5faef',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  guideHintWrap: {
    marginTop: 88,
    marginHorizontal: 20,
    alignItems: 'flex-start',
  },
  guideHint: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(16, 29, 19, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(195, 220, 184, 0.2)',
  },
  guideHintText: {
    color: '#f5faef',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomDock: {
    alignItems: 'center',
  },
  secondaryButton: {
    minWidth: 156,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    backgroundColor: 'rgba(251, 249, 245, 0.92)',
  },
  secondaryButtonText: {
    color: '#17361d',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
