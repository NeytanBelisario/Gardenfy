import React, { useCallback, useMemo, useRef, useState } from 'react';
import { NativeModules, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import Constants from 'expo-constants';
import {
  ViroAmbientLight,
  Viro3DObject,
  ViroAnimations,
  ViroARPlane,
  ViroARScene,
  ViroARSceneNavigator,
  ViroAnchor,
  ViroCameraTransform,
  ViroClickStateTypes,
  ViroDirectionalLight,
  ViroMaterials,
  ViroNode,
  ViroPinchStateTypes,
  ViroQuad,
  ViroRotateStateTypes,
  ViroTrackingReason,
  ViroTrackingStateConstants,
  isARSupportedOnDevice,
} from '@reactvision/react-viro';

import { AppHeader } from '../../components/shell/AppHeader';

const PLANT_MODEL = require('../../public/fiddle-leaf-plant.glb');
const GROUND_GRID_TEXTURE = require('../../../assets/expo.icon/Assets/grid.png');
const INITIAL_SCALE = 0.12;
const MIN_SCALE = 0.05;
const MAX_SCALE = 0.35;
const GROUND_GRID_MATERIAL = 'PlantArGroundGrid';
const GROUND_SURFACE_MATERIAL = 'PlantArGroundSurface';
const GROUND_GRID_PULSE_ANIMATION = 'PlantArGroundGridPulse';
const MIN_GROUND_PLANE_SIZE = 0.42;
const PLANE_STABLE_UPDATE_COUNT = 3;
const PLANE_STABLE_POSITION_DELTA = 0.04;
const PLANE_STABLE_SIZE_DELTA = 0.08;
const MIN_PLANE_DISTANCE_BELOW_CAMERA = 0.06;

type SupportStatus = 'checking' | 'ready' | 'unsupported' | 'native-misaligned';
type ArOverlayMessage = 'Mapeando ambiente...' | 'Mova devagar' | 'Pronto para posicionar';

type PlantArSceneProps = {
  onTrackingStateChange?: (state: number, reason?: ViroTrackingReason) => void;
  onPlaneStateChange?: (isPlaneDetected: boolean) => void;
  onPlacementChange?: (isPlaced: boolean) => void;
  resetSignal?: number;
};

type GroundPlaneSelectorProps = {
  cameraPosition: [number, number, number] | null;
  isPlaced: boolean;
  minHeight: number;
  minWidth: number;
  onFirstPlaneDetected: () => void;
  onPlaneCountChange: (planeCount: number) => void;
  onPlaneSelected: (position: [number, number, number]) => void;
};

type PlaneCandidate = {
  anchor: ViroAnchor;
  stableUpdates: number;
};

ViroMaterials.createMaterials({
  [GROUND_GRID_MATERIAL]: {
    lightingModel: 'Constant',
    diffuseTexture: GROUND_GRID_TEXTURE,
    diffuseColor: 'rgba(228, 255, 210, 1)',
    blendMode: 'Alpha',
    cullMode: 'None',
    wrapS: 'Repeat',
    wrapT: 'Repeat',
    writesToDepthBuffer: false,
  },
  [GROUND_SURFACE_MATERIAL]: {
    lightingModel: 'Constant',
    diffuseColor: 'rgba(113, 214, 83, 0.24)',
    blendMode: 'Alpha',
    cullMode: 'None',
    writesToDepthBuffer: false,
  },
});

if (NativeModules.VRTAnimationManager) {
  ViroAnimations.registerAnimations({
    [GROUND_GRID_PULSE_ANIMATION]: [
      {
        duration: 420,
        easing: 'EaseOut',
        properties: {
          opacity: 1,
          scaleX: 1.18,
          scaleY: 1.18,
        },
      },
      {
        duration: 520,
        easing: 'EaseInEaseOut',
        properties: {
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
        },
      },
    ],
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isUsableGroundPlane(
  anchor: ViroAnchor,
  cameraPosition: [number, number, number] | null,
  minWidth: number,
  minHeight: number
) {
  if (anchor.type !== 'plane') {
    return false;
  }

  if (!anchor.alignment?.includes('Horizontal') || anchor.alignment === 'HorizontalDownward') {
    return false;
  }

  if ((anchor.width ?? 0) < minWidth || (anchor.height ?? 0) < minHeight) {
    return false;
  }

  if (['Ceiling', 'Wall', 'Door', 'Window', 'Seat'].includes(anchor.classification ?? '')) {
    return false;
  }

  if (!cameraPosition) {
    return false;
  }

  if (anchor.position[1] > cameraPosition[1] - MIN_PLANE_DISTANCE_BELOW_CAMERA) {
    return false;
  }

  return true;
}

function isPlaneStable(previous: ViroAnchor, next: ViroAnchor) {
  const positionDelta = Math.max(
    Math.abs(previous.position[0] - next.position[0]),
    Math.abs(previous.position[1] - next.position[1]),
    Math.abs(previous.position[2] - next.position[2])
  );
  const widthDelta = Math.abs((previous.width ?? 0) - (next.width ?? 0));
  const heightDelta = Math.abs((previous.height ?? 0) - (next.height ?? 0));

  return (
    positionDelta <= PLANE_STABLE_POSITION_DELTA &&
    widthDelta <= PLANE_STABLE_SIZE_DELTA &&
    heightDelta <= PLANE_STABLE_SIZE_DELTA
  );
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

const GroundPlaneSelector = React.forwardRef<
  { handleAnchorFound: (anchor: ViroAnchor) => void; handleAnchorUpdated: (anchor: ViroAnchor) => void; handleAnchorRemoved: (anchor?: ViroAnchor) => void; reset: () => void },
  GroundPlaneSelectorProps
>(function GroundPlaneSelector(
  {
    cameraPosition,
    isPlaced,
    minHeight,
    minWidth,
    onFirstPlaneDetected,
    onPlaneCountChange,
    onPlaneSelected,
  },
  ref
) {
  const [planes, setPlanes] = useState<Map<string, ViroAnchor>>(() => new Map());
  const [selectedPlaneId, setSelectedPlaneId] = useState<string | null>(null);
  const [pulsePlaneId, setPulsePlaneId] = useState<string | null>(null);
  const planeCandidatesRef = useRef<Map<string, PlaneCandidate>>(new Map());
  const hasDetectedPlaneRef = useRef(false);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const removePlane = useCallback((anchorId: string) => {
    planeCandidatesRef.current.delete(anchorId);
    setPlanes((current) => {
      if (!current.has(anchorId)) {
        return current;
      }

      const next = new Map(current);
      next.delete(anchorId);
      return next;
    });
  }, []);

  const evaluatePlaneCandidate = useCallback((anchor: ViroAnchor) => {
    if (!isUsableGroundPlane(anchor, cameraPosition, minWidth, minHeight)) {
      removePlane(anchor.anchorId);
      return;
    }

    const previousCandidate = planeCandidatesRef.current.get(anchor.anchorId);
    const stableUpdates =
      previousCandidate && isPlaneStable(previousCandidate.anchor, anchor)
        ? previousCandidate.stableUpdates + 1
        : 1;

    planeCandidatesRef.current.set(anchor.anchorId, {
      anchor,
      stableUpdates,
    });

    if (stableUpdates < PLANE_STABLE_UPDATE_COUNT) {
      return;
    }

    setPlanes((current) => {
      const currentAnchor = current.get(anchor.anchorId);
      if (currentAnchor && isPlaneStable(currentAnchor, anchor)) {
        return current;
      }

      const next = new Map(current);
      next.set(anchor.anchorId, anchor);
      return next;
    });
  }, [cameraPosition, minHeight, minWidth, removePlane]);

  const handleAnchorFound = useCallback((anchor: ViroAnchor) => {
    evaluatePlaneCandidate(anchor);
  }, [evaluatePlaneCandidate]);

  const handleAnchorUpdated = useCallback((anchor: ViroAnchor) => {
    evaluatePlaneCandidate(anchor);
  }, [evaluatePlaneCandidate]);

  const handleAnchorRemoved = useCallback((anchor?: ViroAnchor) => {
    if (!anchor?.anchorId) {
      return;
    }

    removePlane(anchor.anchorId);
    setSelectedPlaneId((current) => (current === anchor.anchorId ? null : current));
  }, [removePlane]);

  const reset = useCallback(() => {
    planeCandidatesRef.current.clear();
    setPlanes(new Map());
    setSelectedPlaneId(null);
    setPulsePlaneId(null);
    hasDetectedPlaneRef.current = false;
  }, []);

  React.useImperativeHandle(ref, () => ({
    handleAnchorFound,
    handleAnchorUpdated,
    handleAnchorRemoved,
    reset,
  }), [handleAnchorFound, handleAnchorRemoved, handleAnchorUpdated, reset]);

  React.useEffect(() => () => {
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
    }
  }, []);

  React.useEffect(() => {
    onPlaneCountChange(planes.size);
  }, [onPlaneCountChange, planes.size]);

  React.useEffect(() => {
    if (planes.size === 0 || hasDetectedPlaneRef.current) {
      return;
    }

    const firstPlaneId = planes.keys().next().value;
    if (!firstPlaneId) {
      return;
    }

    hasDetectedPlaneRef.current = true;
    setPulsePlaneId(firstPlaneId);
    onFirstPlaneDetected();

    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
    }

    pulseTimeoutRef.current = setTimeout(() => setPulsePlaneId(null), 1100);
  }, [onFirstPlaneDetected, planes]);

  return (
    <ViroNode>
      {Array.from(planes.entries()).map(([anchorId, anchor]) => {
        const isSelected = selectedPlaneId === anchorId;
        const shouldShowGrid = !isPlaced && (selectedPlaneId === null || isSelected);
        const width = Math.max(anchor.width ?? 0.5, minWidth);
        const height = Math.max(anchor.height ?? 0.5, minHeight);

        return (
          <ViroARPlane
            key={anchorId}
            anchorId={anchorId}
            minHeight={minHeight}
            minWidth={minWidth}
            onAnchorUpdated={(updatedAnchor) => handleAnchorUpdated(updatedAnchor as ViroAnchor)}
          >
            <ViroQuad
              height={height}
              materials={[GROUND_SURFACE_MATERIAL]}
              opacity={shouldShowGrid ? 1 : 0}
              position={[0, -0.001, 0]}
              rotation={[-90, 0, 0]}
              width={width}
            />

            <ViroQuad
              animation={{
                name: GROUND_GRID_PULSE_ANIMATION,
                run: pulsePlaneId === anchorId,
                loop: false,
                interruptible: true,
              }}
              height={height}
              materials={[GROUND_GRID_MATERIAL]}
              opacity={shouldShowGrid ? 1 : 0}
              position={[0, 0.001, 0]}
              rotation={[-90, 0, 0]}
              width={width}
              onClickState={(clickState, tapWorld) => {
                if (clickState !== ViroClickStateTypes.CLICKED) {
                  return;
                }

                setSelectedPlaneId(anchorId);
                onPlaneSelected(tapWorld);
              }}
            />
          </ViroARPlane>
        );
      })}
    </ViroNode>
  );
});

function PlantArScene({
  onPlacementChange,
  onPlaneStateChange,
  onTrackingStateChange,
  resetSignal,
}: PlantArSceneProps = {}) {
  const [isPlaced, setIsPlaced] = useState(false);
  const [trackingReady, setTrackingReady] = useState(false);
  const [placedPosition, setPlacedPosition] = useState<[number, number, number] | null>(null);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number] | null>(null);
  const [scale, setScale] = useState(INITIAL_SCALE);
  const [rotationY, setRotationY] = useState(0);
  const [pinchStartScale, setPinchStartScale] = useState(INITIAL_SCALE);
  const [rotateStartY, setRotateStartY] = useState(0);
  const planeSelectorRef = useRef<React.ElementRef<typeof GroundPlaneSelector> | null>(null);

  const handleTrackingUpdated = useCallback((state: number, reason?: ViroTrackingReason) => {
    setTrackingReady(state === ViroTrackingStateConstants.TRACKING_NORMAL);
    onTrackingStateChange?.(state, reason);
  }, [onTrackingStateChange]);

  const handlePlaneCountChange = useCallback((planeCount: number) => {
    onPlaneStateChange?.(planeCount > 0);
  }, [onPlaneStateChange]);

  const handlePlaneSelected = useCallback((position: [number, number, number]) => {
    setPlacedPosition(position);
    setIsPlaced(true);
    onPlacementChange?.(true);
  }, [onPlacementChange]);

  const handleCameraTransformUpdate = useCallback((cameraTransform: ViroCameraTransform) => {
    setCameraPosition(cameraTransform.position);
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

  React.useEffect(() => {
    onPlacementChange?.(false);
    onPlaneStateChange?.(false);
  }, [onPlacementChange, onPlaneStateChange]);

  React.useEffect(() => {
    if (resetSignal === undefined) {
      return;
    }

    setIsPlaced(false);
    setPlacedPosition(null);
    planeSelectorRef.current?.reset();
    onPlacementChange?.(false);
    onPlaneStateChange?.(false);
  }, [onPlacementChange, onPlaneStateChange, resetSignal]);

  return (
    <ViroARScene
      anchorDetectionTypes={['PlanesHorizontal']}
      onTrackingUpdated={handleTrackingUpdated}
      onCameraTransformUpdate={handleCameraTransformUpdate}
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

      <GroundPlaneSelector
        ref={planeSelectorRef}
        cameraPosition={cameraPosition}
        minHeight={MIN_GROUND_PLANE_SIZE}
        minWidth={MIN_GROUND_PLANE_SIZE}
        isPlaced={isPlaced}
        onFirstPlaneDetected={() => onPlaneStateChange?.(true)}
        onPlaneCountChange={handlePlaneCountChange}
        onPlaneSelected={handlePlaneSelected}
      />

      {placedPosition && (
        <ViroNode position={placedPosition}>
          <Viro3DObject
            source={PLANT_MODEL}
            type="GLB"
            position={[0, 0.02, 0]}
            rotation={[0, rotationY, 0]}
            scale={[scale, scale, scale]}
            onPinch={handlePinch}
            onRotate={handleRotate}
            visible={isPlaced && trackingReady}
          />
        </ViroNode>
      )}
    </ViroARScene>
  );
}

export function PlantArScreen() {
  const [supportStatus, setSupportStatus] = useState<SupportStatus>(
    Platform.OS === 'web' ? 'unsupported' : 'checking'
  );
  const [isGuideVisible, setIsGuideVisible] = useState(true);
  const [trackingState, setTrackingState] = useState<number | null>(null);
  const [isPlaneDetected, setIsPlaneDetected] = useState(false);
  const [isPlantPlaced, setIsPlantPlaced] = useState(false);
  const [arResetSignal, setArResetSignal] = useState(0);
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

  const arOverlayMessage: ArOverlayMessage = useMemo(() => {
    if (trackingState !== ViroTrackingStateConstants.TRACKING_NORMAL) {
      return 'Mapeando ambiente...';
    }

    if (!isPlaneDetected) {
      return 'Mova devagar';
    }

    return 'Pronto para posicionar';
  }, [isPlaneDetected, trackingState]);

  const handleTrackingStateChange = useCallback((state: number) => {
    setTrackingState(state);
  }, []);

  const handlePlaneStateChange = useCallback((nextIsPlaneDetected: boolean) => {
    setIsPlaneDetected(nextIsPlaneDetected);
  }, []);

  const handlePlacementChange = useCallback((nextIsPlantPlaced: boolean) => {
    setIsPlantPlaced(nextIsPlantPlaced);
  }, []);

  const initialArScene = useMemo(() => ({
    scene: PlantArScene,
    passProps: {
      onPlacementChange: handlePlacementChange,
      onPlaneStateChange: handlePlaneStateChange,
      onTrackingStateChange: handleTrackingStateChange,
      resetSignal: arResetSignal,
    },
  }), [arResetSignal, handlePlacementChange, handlePlaneStateChange, handleTrackingStateChange]);

  const handleReposition = useCallback(() => {
    setIsPlantPlaced(false);
    setIsPlaneDetected(false);
    setTrackingState(null);
    setArResetSignal((current) => current + 1);
    arNavigatorRef.current?._resetARSession?.(true, true);
  }, []);

  return (
    <View style={styles.screen}>
      {canRenderAr ? (
        <ViroARSceneNavigator
          key={`plant-ar-${arResetSignal}`}
          ref={arNavigatorRef}
          autofocus
          hdrEnabled
          pbrEnabled
          shadowsEnabled
          initialScene={initialArScene}
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

          {canRenderAr && (
            <View style={styles.trackingStatusWrap} pointerEvents="none">
              <View
                style={[
                  styles.trackingStatus,
                  arOverlayMessage === 'Pronto para posicionar' && styles.trackingStatusReady,
                ]}
              >
                <View
                  style={[
                    styles.trackingDot,
                    arOverlayMessage === 'Pronto para posicionar' && styles.trackingDotReady,
                  ]}
                />
                <Text style={styles.trackingStatusText}>{arOverlayMessage}</Text>
              </View>
            </View>
          )}

          {isGuideVisible ? (
            <View style={[styles.topCard, canRenderAr && styles.topCardAfterStatus]}>
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
              {canRenderAr && isPlantPlaced ? (
                <Text style={styles.placementHint}>Planta posicionada. Use dois dedos para ajustar.</Text>
              ) : null}
            </View>
          ) : (
            <View
              style={[styles.guideHintWrap, canRenderAr && styles.guideHintWrapAfterStatus]}
              pointerEvents="box-none"
            >
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
  topCardAfterStatus: {
    marginTop: 12,
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
  placementHint: {
    marginTop: 10,
    color: '#b6d7a4',
    fontSize: 12,
    fontWeight: '700',
  },
  trackingStatusWrap: {
    marginTop: 88,
    marginHorizontal: 20,
    alignItems: 'flex-start',
  },
  trackingStatus: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 24, 18, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(244, 248, 238, 0.18)',
  },
  trackingStatusReady: {
    backgroundColor: 'rgba(22, 54, 29, 0.78)',
    borderColor: 'rgba(182, 215, 164, 0.36)',
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#f0d16b',
  },
  trackingDotReady: {
    backgroundColor: '#9be27c',
  },
  trackingStatusText: {
    color: '#f5faef',
    fontSize: 13,
    fontWeight: '800',
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
  guideHintWrapAfterStatus: {
    marginTop: 12,
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
