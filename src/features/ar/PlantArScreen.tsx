import React, { useCallback, useMemo, useRef, useState } from 'react';
import { NativeModules, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import Constants from 'expo-constants';
import {
  ViroAmbientLight,
  ViroAnchor,
  ViroARScene,
  ViroARSceneNavigator,
  ViroCameraTransform,
  ViroDirectionalLight,
  ViroMaterials,
  ViroNode,
  ViroPolygon,
  ViroPolyline,
  ViroQuad,
  ViroSphere,
  ViroTrackingReason,
  ViroTrackingStateConstants,
  isARSupportedOnDevice,
} from '@reactvision/react-viro';

import { AppHeader } from '../../components/shell/AppHeader';

const SURFACE_GRID_TEXTURE = require('../../../assets/expo.icon/Assets/grid.png');
const CORNER_MARKER_MATERIAL = 'PlantArCornerMarker';
const CORNER_MARKER_HOT_MATERIAL = 'PlantArCornerMarkerHot';
const SELECTABLE_SURFACE_FILL_MATERIAL = 'PlantArSelectableSurfaceFill';
const SELECTABLE_SURFACE_GRID_MATERIAL = 'PlantArSelectableSurfaceGrid';
const SELECTABLE_SURFACE_BORDER_MATERIAL = 'PlantArSelectableSurfaceBorder';
const LOCKED_SURFACE_BORDER_MATERIAL = 'PlantArLockedSurfaceBorder';
const POINT_CLOUD_UPDATE_THROTTLE_MS = 140;
const MAX_POINTS_TO_EVALUATE = 420;
const MIN_CAMERA_DISTANCE_METERS = 0.18;
const MAX_CAMERA_DISTANCE_METERS = 4.2;
const BASE_MARKER_RADIUS = 0.022;
const MIN_SELECTABLE_SURFACE_SIZE = 0.18;
const MIN_POINT_SUPPORT_FOR_HOT_CORNER = 32;
const STABLE_SURFACE_POSITION_DELTA = 0.025;
const STABLE_SURFACE_SIZE_DELTA = 0.04;
const LOCKED_SURFACE_SAFE_PADDING = 0.22;
const SURFACE_LOCK_TIME_MS = 10000;
const SURFACE_OUT_OF_VIEW_GRACE_MS = 420;
const SURFACE_VIEW_DOT_THRESHOLD = 0.22;
const CAMERA_MOVE_DISCARD_DISTANCE = 0.075;
const CAMERA_TURN_DISCARD_DOT = 0.93;
const SURFACE_MIN_QUALITY_SCORE = 0.68;
const SURFACE_AREA_GROWTH_PENALTY_THRESHOLD = 0.12;
const SURFACE_SHRINK_SNAP_THRESHOLD = 0.08;
const SURFACE_MIN_STABLE_SAMPLES = 18;

type SupportStatus = 'checking' | 'ready' | 'unsupported' | 'native-misaligned';
type ArOverlayMessage = 'Mapeando ambiente...' | 'Procurando superficies' | 'Superficie segura';
type Point3D = [number, number, number];
type Point2D = [number, number];
type CameraPose = {
  position: Point3D;
  forward: Point3D;
};

type PlantArSceneProps = {
  onTrackingStateChange?: (state: number, reason?: ViroTrackingReason) => void;
  onFeatureStateChange?: (hasFeatures: boolean) => void;
  onScanStatsChange?: (stats: ScanStats) => void;
  resetSignal?: number;
};

type ScanStats = {
  rawPointCount: number;
  markerCount: number;
  surfaceCount: number;
  lockedSurfaceCount: number;
};

type CornerMarker = {
  id: string;
  confidence: number;
  radius: number;
};

type SelectableSurface = {
  anchor: ViroAnchor;
  bestAnchor: ViroAnchor;
  bestQualityScore: number;
  firstStableSeenAt: number;
  lastInViewAt: number;
  locked: boolean;
  pointSupport: number;
  safeRadius: number;
  stableSampleCount: number;
  stableUpdates: number;
};

ViroMaterials.createMaterials({
  [CORNER_MARKER_MATERIAL]: {
    lightingModel: 'Constant',
    diffuseColor: 'rgba(78, 218, 255, 0.92)',
    blendMode: 'Alpha',
  },
  [CORNER_MARKER_HOT_MATERIAL]: {
    lightingModel: 'Constant',
    diffuseColor: 'rgba(255, 206, 86, 1)',
    blendMode: 'Alpha',
  },
  [SELECTABLE_SURFACE_FILL_MATERIAL]: {
    lightingModel: 'Constant',
    diffuseColor: 'rgba(255, 255, 255, 0.18)',
    blendMode: 'Alpha',
    cullMode: 'None',
    writesToDepthBuffer: false,
  },
  [SELECTABLE_SURFACE_GRID_MATERIAL]: {
    lightingModel: 'Constant',
    diffuseTexture: SURFACE_GRID_TEXTURE,
    diffuseColor: 'rgba(255, 255, 255, 0.86)',
    blendMode: 'Alpha',
    cullMode: 'None',
    wrapS: 'Repeat',
    wrapT: 'Repeat',
    writesToDepthBuffer: false,
  },
  [SELECTABLE_SURFACE_BORDER_MATERIAL]: {
    lightingModel: 'Constant',
    diffuseColor: 'rgba(255, 255, 255, 1)',
  },
  [LOCKED_SURFACE_BORDER_MATERIAL]: {
    lightingModel: 'Constant',
    diffuseColor: 'rgba(255, 220, 122, 1)',
  },
});

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function asPoint3D(value: unknown): Point3D | null {
  if (Array.isArray(value) && value.length >= 3) {
    const [x, y, z] = value;
    return isFiniteNumber(x) && isFiniteNumber(y) && isFiniteNumber(z) ? [x, y, z] : null;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (isFiniteNumber(record.x) && isFiniteNumber(record.y) && isFiniteNumber(record.z)) {
    return [record.x, record.y, record.z];
  }

  return asPoint3D(record.position ?? record.coordinates ?? record.point);
}

function collectPointCloudPoints(input: unknown, limit = MAX_POINTS_TO_EVALUATE, output: Point3D[] = []) {
  if (output.length >= limit || input == null) {
    return output;
  }

  if (ArrayBuffer.isView(input) && 'length' in input) {
    const values = Array.from(input as unknown as ArrayLike<number>);
    for (let index = 0; index + 2 < values.length && output.length < limit; index += 3) {
      const point = asPoint3D([values[index], values[index + 1], values[index + 2]]);
      if (point) {
        output.push(point);
      }
    }
    return output;
  }

  if (Array.isArray(input)) {
    if (input.every(isFiniteNumber)) {
      for (let index = 0; index + 2 < input.length && output.length < limit; index += 3) {
        const point = asPoint3D([input[index], input[index + 1], input[index + 2]]);
        if (point) {
          output.push(point);
        }
      }
      return output;
    }

    input.forEach((item) => collectPointCloudPoints(item, limit, output));
    return output;
  }

  const directPoint = asPoint3D(input);
  if (directPoint) {
    output.push(directPoint);
    return output;
  }

  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;
    ['points', 'positions', 'featurePoints', 'rawFeaturePoints', 'pointCloud'].forEach((key) => {
      if (output.length < limit && record[key] != null) {
        collectPointCloudPoints(record[key], limit, output);
      }
    });
  }

  return output;
}

function distanceBetween(first: Point3D, second: Point3D) {
  const dx = first[0] - second[0];
  const dy = first[1] - second[1];
  const dz = first[2] - second[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function dotProduct(first: Point3D, second: Point3D) {
  return first[0] * second[0] + first[1] * second[1] + first[2] * second[2];
}

function normalizeVector(vector: Point3D): Point3D {
  const length = Math.sqrt(dotProduct(vector, vector));
  if (length <= 0.0001) {
    return [0, 0, -1];
  }

  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isSelectableSurfaceAnchor(anchor: ViroAnchor) {
  if (anchor.type !== 'plane') {
    return false;
  }

  if (!anchor.alignment || anchor.alignment === 'HorizontalDownward') {
    return false;
  }

  if (['Ceiling', 'Seat', 'Door', 'Window'].includes(anchor.classification ?? '')) {
    return false;
  }

  return (
    (anchor.width ?? 0) >= MIN_SELECTABLE_SURFACE_SIZE &&
    (anchor.height ?? 0) >= MIN_SELECTABLE_SURFACE_SIZE
  );
}

function countSupportedPoints(points: Point3D[], anchor: ViroAnchor, cameraPosition: Point3D | null) {
  const width = anchor.width ?? 0;
  const height = anchor.height ?? 0;
  const halfDiagonal = Math.sqrt(width * width + height * height) / 2;
  const maxDistance = Math.max(halfDiagonal + 0.24, 0.42);

  return points.filter((point) => {
    if (cameraPosition) {
      const cameraDistance = distanceBetween(point, cameraPosition);
      if (cameraDistance < MIN_CAMERA_DISTANCE_METERS || cameraDistance > MAX_CAMERA_DISTANCE_METERS) {
        return false;
      }
    }

    return distanceBetween(point, anchor.position) <= maxDistance;
  }).length;
}

function surfaceSafeRadius(anchor: ViroAnchor) {
  const width = Math.max(anchor.width ?? MIN_SELECTABLE_SURFACE_SIZE, MIN_SELECTABLE_SURFACE_SIZE);
  const height = Math.max(anchor.height ?? MIN_SELECTABLE_SURFACE_SIZE, MIN_SELECTABLE_SURFACE_SIZE);
  return Math.sqrt(width * width + height * height) / 2 + LOCKED_SURFACE_SAFE_PADDING;
}

function surfaceArea(anchor: ViroAnchor) {
  return Math.max(anchor.width ?? 0, MIN_SELECTABLE_SURFACE_SIZE) * Math.max(anchor.height ?? 0, MIN_SELECTABLE_SURFACE_SIZE);
}

function polygonArea(vertices: Point2D[]) {
  if (vertices.length < 3) {
    return 0;
  }

  const signedArea = vertices.reduce((total, vertex, index) => {
    const nextVertex = vertices[(index + 1) % vertices.length];
    return total + vertex[0] * nextVertex[1] - nextVertex[0] * vertex[1];
  }, 0);

  return Math.abs(signedArea) / 2;
}

function surfaceActualCoverage(anchor: ViroAnchor) {
  if (!anchor.vertices || anchor.vertices.length < 3) {
    return 0.72;
  }

  return clamp(polygonArea(anchor.vertices.map((vertex) => [vertex[0], vertex[2]])) / surfaceArea(anchor), 0, 1);
}

function isAnchorStable(previous: ViroAnchor, next: ViroAnchor) {
  const positionDelta = Math.max(
    Math.abs(previous.position[0] - next.position[0]),
    Math.abs(previous.position[1] - next.position[1]),
    Math.abs(previous.position[2] - next.position[2])
  );
  const widthDelta = Math.abs((previous.width ?? 0) - (next.width ?? 0));
  const heightDelta = Math.abs((previous.height ?? 0) - (next.height ?? 0));
  const previousVertexCount = previous.vertices?.length ?? 0;
  const nextVertexCount = next.vertices?.length ?? 0;

  return (
    positionDelta <= STABLE_SURFACE_POSITION_DELTA &&
    widthDelta <= STABLE_SURFACE_SIZE_DELTA &&
    heightDelta <= STABLE_SURFACE_SIZE_DELTA &&
    previousVertexCount === nextVertexCount
  );
}

function surfaceQualityScore(anchor: ViroAnchor, previous?: SelectableSurface) {
  const currentArea = surfaceArea(anchor);
  const previousArea = previous ? surfaceArea(previous.anchor) : currentArea;
  const bestArea = previous ? surfaceArea(previous.bestAnchor) : currentArea;
  const areaDeltaRatio = previousArea <= 0 ? 0 : Math.abs(currentArea - previousArea) / previousArea;
  const growthRatio = previousArea <= 0 ? 0 : Math.max(0, currentArea - previousArea) / previousArea;
  const overBestGrowthRatio = bestArea <= 0 ? 0 : Math.max(0, currentArea - bestArea) / bestArea;
  const vertexCount = anchor.vertices?.length ?? 4;
  const shapeScore = clamp(vertexCount / 7, 0.35, 1);
  const coverageScore = surfaceActualCoverage(anchor);
  const stabilityScore = clamp(1 - areaDeltaRatio / SURFACE_AREA_GROWTH_PENALTY_THRESHOLD, 0, 1);
  const growthPenalty = clamp((growthRatio + overBestGrowthRatio) / SURFACE_AREA_GROWTH_PENALTY_THRESHOLD, 0, 1) * 0.32;

  return clamp(shapeScore * 0.28 + coverageScore * 0.24 + stabilityScore * 0.48 - growthPenalty, 0, 1);
}

function isInsideLockedSafeArea(anchor: ViroAnchor, surfaces: Map<string, SelectableSurface>) {
  const candidateRadius = surfaceSafeRadius(anchor);

  return Array.from(surfaces.entries()).some(([surfaceId, surface]) => {
    if (surfaceId === anchor.anchorId || !surface.locked) {
      return false;
    }

    if (surface.anchor.alignment !== anchor.alignment) {
      return false;
    }

    const safeDistance = Math.max(surface.safeRadius, candidateRadius) * 0.72;
    return distanceBetween(surface.anchor.position, anchor.position) < safeDistance;
  });
}

function isSurfaceInCameraView(anchor: ViroAnchor, cameraPose: CameraPose | null) {
  if (!cameraPose) {
    return true;
  }

  const toSurface: Point3D = [
    anchor.position[0] - cameraPose.position[0],
    anchor.position[1] - cameraPose.position[1],
    anchor.position[2] - cameraPose.position[2],
  ];
  const distance = Math.sqrt(dotProduct(toSurface, toSurface));

  if (distance < MIN_CAMERA_DISTANCE_METERS || distance > MAX_CAMERA_DISTANCE_METERS) {
    return false;
  }

  const directionToSurface = normalizeVector(toSurface);
  const cameraForward = normalizeVector(cameraPose.forward);
  return dotProduct(cameraForward, directionToSurface) >= SURFACE_VIEW_DOT_THRESHOLD;
}

function isCameraMovingQuickly(previous: CameraPose | null, next: CameraPose) {
  if (!previous) {
    return false;
  }

  const movedDistance = distanceBetween(previous.position, next.position);
  const forwardDot = dotProduct(normalizeVector(previous.forward), normalizeVector(next.forward));

  return movedDistance >= CAMERA_MOVE_DISCARD_DISTANCE || forwardDot <= CAMERA_TURN_DISCARD_DOT;
}

function fallbackSurfaceCornerPositions(width: number, height: number): Point3D[] {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  return [
    [-halfWidth, 0.018, -halfHeight],
    [halfWidth, 0.018, -halfHeight],
    [halfWidth, 0.018, halfHeight],
    [-halfWidth, 0.018, halfHeight],
  ];
}

function surfaceVertices(anchor: ViroAnchor, width: number, height: number): Point3D[] {
  if (anchor.vertices && anchor.vertices.length >= 3) {
    return anchor.vertices.map((vertex): Point3D => [vertex[0], 0.018, vertex[2]]);
  }

  return fallbackSurfaceCornerPositions(width, height);
}

function surfacePolygonVertices(anchor: ViroAnchor, width: number, height: number): Point2D[] {
  return surfaceVertices(anchor, width, height).map((point) => [point[0], point[2]]);
}

function surfaceBorderPoints(anchor: ViroAnchor, width: number, height: number): Point3D[] {
  const corners = surfaceVertices(anchor, width, height).map((point): Point3D => [point[0], 0.012, point[2]]);
  return [...corners, corners[0]];
}

function surfaceGridLines(width: number, height: number) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const step = 0.16;
  const lines: Point3D[][] = [];

  for (let x = -halfWidth + step; x < halfWidth; x += step) {
    lines.push([[x, 0.014, -halfHeight], [x, 0.014, halfHeight]]);
  }

  for (let z = -halfHeight + step; z < halfHeight; z += step) {
    lines.push([[-halfWidth, 0.014, z], [halfWidth, 0.014, z]]);
  }

  return lines;
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

function PlantArScene({
  onFeatureStateChange,
  onScanStatsChange,
  onTrackingStateChange,
  resetSignal,
}: PlantArSceneProps = {}) {
  const [trackingReady, setTrackingReady] = useState(false);
  const [cameraPosition, setCameraPosition] = useState<Point3D | null>(null);
  const [surfaces, setSurfaces] = useState<Map<string, SelectableSurface>>(() => new Map());
  const activeSurfaceIdRef = useRef<string | null>(null);
  const lastCameraPoseRef = useRef<CameraPose | null>(null);
  const cameraPoseRef = useRef<CameraPose | null>(null);
  const surfacesRef = useRef<Map<string, SelectableSurface>>(new Map());
  const lastPointCloudUpdateRef = useRef(0);
  const lastRawPointCountRef = useRef(0);

  const updateSurfaceCount = useCallback((nextSurfaces: Map<string, SelectableSurface>, rawPointCount = 0) => {
    const markerCount = Array.from(nextSurfaces.values()).reduce((total, surface) => {
      const width = Math.max(surface.anchor.width ?? MIN_SELECTABLE_SURFACE_SIZE, MIN_SELECTABLE_SURFACE_SIZE);
      const height = Math.max(surface.anchor.height ?? MIN_SELECTABLE_SURFACE_SIZE, MIN_SELECTABLE_SURFACE_SIZE);
      return total + surfaceVertices(surface.anchor, width, height).length;
    }, 0);
    const lockedSurfaceCount = Array.from(nextSurfaces.values()).filter((surface) => surface.locked).length;

    onFeatureStateChange?.(nextSurfaces.size > 0);
    onScanStatsChange?.({
      rawPointCount,
      markerCount,
      surfaceCount: nextSurfaces.size,
      lockedSurfaceCount,
    });
  }, [onFeatureStateChange, onScanStatsChange]);

  const commitSurfaces = useCallback((
    nextSurfaces: Map<string, SelectableSurface>,
    rawPointCount = lastRawPointCountRef.current
  ) => {
    const currentActiveSurface = activeSurfaceIdRef.current
      ? nextSurfaces.get(activeSurfaceIdRef.current)
      : null;

    if (!currentActiveSurface || currentActiveSurface.locked) {
      activeSurfaceIdRef.current =
        Array.from(nextSurfaces.entries()).find(([, surface]) => !surface.locked)?.[0] ?? null;
    }

    surfacesRef.current = nextSurfaces;
    setSurfaces(nextSurfaces);
    updateSurfaceCount(nextSurfaces, rawPointCount);
  }, [updateSurfaceCount]);

  const handleTrackingUpdated = useCallback((state: number, reason?: ViroTrackingReason) => {
    setTrackingReady(state === ViroTrackingStateConstants.TRACKING_NORMAL);
    onTrackingStateChange?.(state, reason);
  }, [onTrackingStateChange]);

  const discardActiveCandidate = useCallback(() => {
    const activeSurfaceId = activeSurfaceIdRef.current;
    if (!activeSurfaceId) {
      return false;
    }

    const activeSurface = surfacesRef.current.get(activeSurfaceId);
    if (!activeSurface || activeSurface.locked) {
      return false;
    }

    const nextSurfaces = new Map(surfacesRef.current);
    nextSurfaces.delete(activeSurfaceId);
    activeSurfaceIdRef.current = null;
    commitSurfaces(nextSurfaces);
    return true;
  }, [commitSurfaces]);

  const dropOutOfViewCandidates = useCallback((cameraPose: CameraPose) => {
    const now = Date.now();
    let changed = false;
    const nextSurfaces = new Map<string, SelectableSurface>();

    surfacesRef.current.forEach((surface, anchorId) => {
      if (surface.locked) {
        nextSurfaces.set(anchorId, surface);
        return;
      }

      const isInView = isSurfaceInCameraView(surface.anchor, cameraPose);
      const lastInViewAt = isInView ? now : surface.lastInViewAt;

      if (!isInView && now - lastInViewAt > SURFACE_OUT_OF_VIEW_GRACE_MS) {
        changed = true;
        return;
      }

      if (lastInViewAt !== surface.lastInViewAt) {
        changed = true;
      }

      nextSurfaces.set(anchorId, {
        ...surface,
        lastInViewAt,
      });
    });

    if (changed) {
      commitSurfaces(nextSurfaces);
    }
  }, [commitSurfaces]);

  const handleCameraTransformUpdate = useCallback((cameraTransform: ViroCameraTransform) => {
    const cameraPose: CameraPose = {
      position: cameraTransform.position,
      forward: cameraTransform.forward,
    };

    cameraPoseRef.current = cameraPose;
    setCameraPosition(cameraTransform.position);

    if (isCameraMovingQuickly(lastCameraPoseRef.current, cameraPose) && discardActiveCandidate()) {
      lastCameraPoseRef.current = cameraPose;
      return;
    }

    lastCameraPoseRef.current = cameraPose;
    dropOutOfViewCandidates(cameraPose);
  }, [discardActiveCandidate, dropOutOfViewCandidates]);

  const handleAnchorFoundOrUpdated = useCallback((anchor: ViroAnchor) => {
    const nextSurfaces = new Map(surfacesRef.current);
    const previous = nextSurfaces.get(anchor.anchorId);
    const activeSurfaceId = activeSurfaceIdRef.current;

    if (previous?.locked) {
      return;
    }

    if (activeSurfaceId && activeSurfaceId !== anchor.anchorId) {
      return;
    }

    if (
      !isSelectableSurfaceAnchor(anchor) ||
      !isSurfaceInCameraView(anchor, cameraPoseRef.current) ||
      isInsideLockedSafeArea(anchor, nextSurfaces)
    ) {
      const existing = nextSurfaces.get(anchor.anchorId);
      if (!existing?.locked) {
        nextSurfaces.delete(anchor.anchorId);
        commitSurfaces(nextSurfaces);
      }
      return;
    }

    const stableUpdates = previous && isAnchorStable(previous.anchor, anchor)
      ? previous.stableUpdates + 1
      : 1;
    const now = Date.now();
    const firstStableSeenAt = previous && isAnchorStable(previous.anchor, anchor)
      ? previous.firstStableSeenAt
      : now;
    const qualityScore = surfaceQualityScore(anchor, previous);
    const currentArea = surfaceArea(anchor);
    const previousArea = previous ? surfaceArea(previous.anchor) : currentArea;
    const bestArea = previous ? surfaceArea(previous.bestAnchor) : currentArea;
    const areaGrowthRatio = previousArea <= 0 ? 0 : Math.max(0, currentArea - previousArea) / previousArea;
    const stableSampleCount =
      previous && areaGrowthRatio <= SURFACE_AREA_GROWTH_PENALTY_THRESHOLD
        ? previous.stableSampleCount + 1
        : 1;
    const shouldPreferShrink =
      previous &&
      currentArea < bestArea * (1 - SURFACE_SHRINK_SNAP_THRESHOLD) &&
      qualityScore >= previous.bestQualityScore * 0.82;
    const shouldReplaceBest =
      !previous ||
      qualityScore > previous.bestQualityScore ||
      Boolean(shouldPreferShrink);
    const bestAnchor = shouldReplaceBest ? anchor : previous.bestAnchor;
    const bestQualityScore = shouldReplaceBest ? qualityScore : previous.bestQualityScore;
    const isMature =
      now - firstStableSeenAt >= SURFACE_LOCK_TIME_MS &&
      stableSampleCount >= SURFACE_MIN_STABLE_SAMPLES &&
      bestQualityScore >= SURFACE_MIN_QUALITY_SCORE &&
      areaGrowthRatio <= SURFACE_AREA_GROWTH_PENALTY_THRESHOLD;
    const shouldLock = isMature;
    const nextAnchor = shouldLock ? bestAnchor : anchor;

    nextSurfaces.set(anchor.anchorId, {
      anchor: nextAnchor,
      bestAnchor,
      bestQualityScore,
      firstStableSeenAt,
      lastInViewAt: now,
      locked: shouldLock,
      pointSupport: previous?.pointSupport ?? 0,
      safeRadius: surfaceSafeRadius(nextAnchor),
      stableSampleCount,
      stableUpdates,
    });
    activeSurfaceIdRef.current = shouldLock ? null : anchor.anchorId;
    commitSurfaces(nextSurfaces);
  }, [commitSurfaces]);

  const handleAnchorRemoved = useCallback((anchor?: ViroAnchor) => {
    if (!anchor?.anchorId) {
      return;
    }

    const existing = surfacesRef.current.get(anchor.anchorId);
    if (existing?.locked) {
      return;
    }

    const nextSurfaces = new Map(surfacesRef.current);
    nextSurfaces.delete(anchor.anchorId);
    if (activeSurfaceIdRef.current === anchor.anchorId) {
      activeSurfaceIdRef.current = null;
    }
    commitSurfaces(nextSurfaces);
  }, [commitSurfaces]);

  const handlePointCloudUpdate = useCallback((pointCloud: unknown) => {
    const now = Date.now();
    if (now - lastPointCloudUpdateRef.current < POINT_CLOUD_UPDATE_THROTTLE_MS) {
      return;
    }

    lastPointCloudUpdateRef.current = now;
    const rawPoints = collectPointCloudPoints(pointCloud);
    lastRawPointCountRef.current = rawPoints.length;
    const nextSurfaces = new Map(
      Array.from(surfacesRef.current.entries()).map(([anchorId, surface]) => [
        anchorId,
        {
          ...surface,
          pointSupport: countSupportedPoints(rawPoints, surface.anchor, cameraPosition),
        },
      ])
    );
    commitSurfaces(nextSurfaces, rawPoints.length);
  }, [cameraPosition, commitSurfaces]);

  React.useEffect(() => {
    onFeatureStateChange?.(false);
    onScanStatsChange?.({ rawPointCount: 0, markerCount: 0, surfaceCount: 0, lockedSurfaceCount: 0 });
  }, [onFeatureStateChange, onScanStatsChange]);

  React.useEffect(() => {
    if (resetSignal === undefined) {
      return;
    }

    commitSurfaces(new Map());
    activeSurfaceIdRef.current = null;
    cameraPoseRef.current = null;
    lastCameraPoseRef.current = null;
    lastPointCloudUpdateRef.current = 0;
    lastRawPointCountRef.current = 0;
  }, [commitSurfaces, resetSignal]);

  return (
    <ViroARScene
      anchorDetectionTypes={['PlanesHorizontal', 'PlanesVertical']}
      onARPointCloudUpdate={handlePointCloudUpdate}
      onTrackingUpdated={handleTrackingUpdated}
      onCameraTransformUpdate={handleCameraTransformUpdate}
      onAnchorFound={handleAnchorFoundOrUpdated}
      onAnchorUpdated={handleAnchorFoundOrUpdated}
      onAnchorRemoved={handleAnchorRemoved}
    >
      <ViroAmbientLight color="#ffffff" intensity={560} />
      <ViroDirectionalLight
        color="#fff4db"
        direction={[-0.25, -1, -0.35]}
        intensity={920}
      />

      <ViroNode visible={trackingReady}>
        {Array.from(surfaces.entries()).map(([anchorId, surface]) => {
          const displayAnchor = surface.locked ? surface.anchor : surface.bestAnchor;
          const width = Math.max(displayAnchor.width ?? MIN_SELECTABLE_SURFACE_SIZE, MIN_SELECTABLE_SURFACE_SIZE);
          const height = Math.max(displayAnchor.height ?? MIN_SELECTABLE_SURFACE_SIZE, MIN_SELECTABLE_SURFACE_SIZE);
          const confidence = clamp(surface.pointSupport / MIN_POINT_SUPPORT_FOR_HOT_CORNER, 0, 1);
          const cornerMarker: CornerMarker = {
            id: anchorId,
            confidence,
            radius: BASE_MARKER_RADIUS + confidence * 0.01 + (surface.locked ? 0.006 : 0),
          };
          const cornerMaterial =
            surface.locked || cornerMarker.confidence >= 0.8 ? CORNER_MARKER_HOT_MATERIAL : CORNER_MARKER_MATERIAL;
          const borderMaterial = surface.locked ? LOCKED_SURFACE_BORDER_MATERIAL : SELECTABLE_SURFACE_BORDER_MATERIAL;
          const polygonVertices = surfacePolygonVertices(displayAnchor, width, height);
          const hasActualShape = (displayAnchor.vertices?.length ?? 0) >= 3;
          const surfaceMesh = (
            <>
              {hasActualShape ? (
                <ViroPolygon
                  vertices={polygonVertices}
                  holes={[]}
                  rotation={[-90, 0, 0]}
                  position={[0, 0.002, 0]}
                  materials={[SELECTABLE_SURFACE_FILL_MATERIAL]}
                  opacity={surface.locked ? 0.28 : 0.2}
                />
              ) : (
                <ViroQuad
                  width={width}
                  height={height}
                  rotation={[-90, 0, 0]}
                  position={[0, 0.002, 0]}
                  materials={[SELECTABLE_SURFACE_FILL_MATERIAL]}
                  opacity={surface.locked ? 1 : 0.88}
                />
              )}
              <ViroQuad
                width={width}
                height={height}
                rotation={[-90, 0, 0]}
                position={[0, 0.006, 0]}
                materials={[SELECTABLE_SURFACE_GRID_MATERIAL]}
                opacity={surface.locked ? 0.82 : 0.58}
              />
              <ViroPolyline
                points={surfaceBorderPoints(displayAnchor, width, height)}
                thickness={surface.locked ? 0.018 : 0.01}
                materials={[borderMaterial]}
              />
              {surfaceGridLines(width, height).map((line, index) => (
                <ViroPolyline
                  key={`${anchorId}-grid-${index}`}
                  points={line}
                  thickness={0.004}
                  materials={[borderMaterial]}
                  opacity={surface.locked ? 0.52 : 0.34}
                />
              ))}
              {surfaceVertices(displayAnchor, width, height).map((position, index) => (
                <ViroSphere
                  key={`${cornerMarker.id}-corner-${index}`}
                  position={position}
                  radius={cornerMarker.radius}
                  widthSegmentCount={12}
                  heightSegmentCount={8}
                  materials={[cornerMaterial]}
                  opacity={0.98}
                />
              ))}
            </>
          );

          return (
            <ViroNode
              key={anchorId}
              position={displayAnchor.position}
              rotation={displayAnchor.rotation}
            >
              {surfaceMesh}
            </ViroNode>
          );
        })}
      </ViroNode>
    </ViroARScene>
  );
}

export function PlantArScreen() {
  const [supportStatus, setSupportStatus] = useState<SupportStatus>(
    Platform.OS === 'web' ? 'unsupported' : 'checking'
  );
  const [isGuideVisible, setIsGuideVisible] = useState(true);
  const [trackingState, setTrackingState] = useState<number | null>(null);
  const [hasFeaturePoints, setHasFeaturePoints] = useState(false);
  const [scanStats, setScanStats] = useState<ScanStats>({
    rawPointCount: 0,
    markerCount: 0,
    surfaceCount: 0,
    lockedSurfaceCount: 0,
  });
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

    return 'Foque uma superficie por vez. Se sair da visao ou mover rapido antes de 10 segundos estaveis, ela e descartada; quando ficar amarela, travou e o app parte para a proxima.';
  }, [isExpoGo, supportStatus]);

  const canRenderAr = Platform.OS !== 'web' && !isExpoGo && supportStatus === 'ready';

  const arOverlayMessage: ArOverlayMessage = useMemo(() => {
    if (trackingState !== ViroTrackingStateConstants.TRACKING_NORMAL) {
      return 'Mapeando ambiente...';
    }

    if (!hasFeaturePoints) {
      return 'Procurando superficies';
    }

    return 'Superficie segura';
  }, [hasFeaturePoints, trackingState]);

  const handleTrackingStateChange = useCallback((state: number) => {
    setTrackingState(state);
  }, []);

  const handleFeatureStateChange = useCallback((nextHasFeaturePoints: boolean) => {
    setHasFeaturePoints(nextHasFeaturePoints);
  }, []);

  const handleScanStatsChange = useCallback((nextStats: ScanStats) => {
    setScanStats(nextStats);
  }, []);

  const initialArScene = useMemo(() => ({
    scene: PlantArScene,
    passProps: {
      onFeatureStateChange: handleFeatureStateChange,
      onScanStatsChange: handleScanStatsChange,
      onTrackingStateChange: handleTrackingStateChange,
      resetSignal: arResetSignal,
    },
  }), [arResetSignal, handleFeatureStateChange, handleScanStatsChange, handleTrackingStateChange]);

  const handleResetScan = useCallback(() => {
    setHasFeaturePoints(false);
    setScanStats({ rawPointCount: 0, markerCount: 0, surfaceCount: 0, lockedSurfaceCount: 0 });
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
                  arOverlayMessage === 'Superficie segura' && styles.trackingStatusReady,
                ]}
              >
                <View
                  style={[
                    styles.trackingDot,
                    arOverlayMessage === 'Superficie segura' && styles.trackingDotReady,
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
                  <Text style={styles.eyebrow}>AR Surface Mesh Lab</Text>
                  <Text style={styles.title}>Superficies, malha e quinas</Text>
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
              {canRenderAr ? (
                <Text style={styles.scanStats}>
                  Superficies: {scanStats.surfaceCount} / fixas: {scanStats.lockedSurfaceCount} / quinas: {scanStats.markerCount}
                </Text>
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
                <Text style={styles.guideHintText}>
                  Superficies {scanStats.surfaceCount} / fixas {scanStats.lockedSurfaceCount}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <View pointerEvents="box-none" style={styles.bottomDock}>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={handleResetScan}
          >
            <Text style={styles.secondaryButtonText}>Resetar scan</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#080d10',
  },
  fallback: {
    flex: 1,
    backgroundColor: '#11191d',
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
    backgroundColor: 'rgba(9, 15, 18, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(206, 239, 244, 0.22)',
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
    color: '#7fd9ff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    marginTop: 6,
    color: '#f5fbff',
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    marginTop: 10,
    color: '#dce9ec',
    fontSize: 13,
    lineHeight: 18,
  },
  scanStats: {
    marginTop: 10,
    color: '#ffdc7a',
    fontSize: 12,
    fontWeight: '800',
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
    backgroundColor: 'rgba(10, 17, 21, 0.74)',
    borderWidth: 1,
    borderColor: 'rgba(244, 248, 238, 0.18)',
  },
  trackingStatusReady: {
    backgroundColor: 'rgba(27, 39, 31, 0.8)',
    borderColor: 'rgba(255, 220, 122, 0.38)',
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#f0d16b',
  },
  trackingDotReady: {
    backgroundColor: '#ffdc7a',
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
    backgroundColor: 'rgba(9, 15, 18, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(206, 239, 244, 0.22)',
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
    color: '#10171c',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
