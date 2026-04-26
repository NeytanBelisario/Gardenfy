import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { AppHeader } from '../../../../components/shell/AppHeader';
import {
  addAnalyzedPlantToGarden,
  useGardenDetails,
} from '../../../../features/gardens/store';
import { PlantAnalysisResult } from '../../../../features/gardens/types';
import { analyzePlantPhoto } from '../../../../features/plant-analysis/geminiAnalysis';

const COLORS = {
  background: '#fbf9f5',
  primary: '#17361d',
  secondary: '#476644',
  tertiarySoft: '#ffb783',
  tertiaryText: '#301400',
  surfaceLow: '#f5f3ef',
  surfaceHigh: '#eae8e4',
  surfaceLowest: '#ffffff',
  outline: '#c2c8bf',
  textMuted: '#5f675d',
  white: '#ffffff',
} as const;

function getParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function ResultRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.resultRow}>
      <View style={styles.resultIcon}>{icon}</View>
      <View>
        <Text style={styles.resultLabel}>{label}</Text>
        <Text style={styles.resultValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function AddPlantByCameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const gardenId = getParam(params.id);
  const garden = useGardenDetails(gardenId);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PlantAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const analyzeAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!gardenId) {
      return;
    }

    if (!asset.base64) {
      setErrorMessage('Nao foi possivel ler a foto em base64.');
      return;
    }

    setPhotoUri(asset.uri);
    setLoading(true);
    setSaved(false);
    setErrorMessage(null);

    try {
      const base64Clean = asset.base64.replace(/^data:image\/\w+;base64,/, '');
      const nextAnalysis = await analyzePlantPhoto(
        base64Clean,
        asset.mimeType ?? 'image/jpeg'
      );

      addAnalyzedPlantToGarden(gardenId, nextAnalysis, asset.uri);
      setAnalysis(nextAnalysis);
      setSaved(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel identificar a planta.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permissao da camera',
        'Autorize a camera para identificar a planta e adiciona-la ao jardim.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      base64: true,
      quality: 0.82,
    });

    if (result.canceled) {
      return;
    }

    await analyzeAsset(result.assets[0]);
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permissao da galeria',
        'Autorize o acesso as fotos para escolher uma imagem da planta.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      base64: true,
      quality: 0.82,
    });

    if (result.canceled) {
      return;
    }

    await analyzeAsset(result.assets[0]);
  };

  return (
    <View style={styles.screen}>
      <AppHeader title="Identificar Planta" mode="back" onPressLeading={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <MaterialCommunityIcons name="file-search-outline" size={36} color={COLORS.tertiaryText} />
          </View>
          <Text style={styles.heroTitle}>Identificacao Inteligente</Text>
          <Text style={styles.heroSubtitle}>
            Tire uma foto para descobrir o nome da planta e salvar os dados em
            {garden ? ` ${garden.name}` : ' seu jardim'}.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.captureButton,
              pressed && styles.captureButtonPressed,
              loading && styles.captureButtonDisabled,
            ]}
            onPress={handleTakePhoto}
            disabled={loading || !gardenId}
          >
            <Ionicons name="camera" size={22} color={COLORS.tertiaryText} />
            <Text style={styles.captureButtonText}>
              {loading ? 'Identificando...' : 'Tirar foto'}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.captureButtonPressed,
              loading && styles.captureButtonDisabled,
            ]}
            onPress={handlePickImage}
            disabled={loading || !gardenId}
          >
            <Ionicons name="images-outline" size={21} color={COLORS.white} />
            <Text style={styles.secondaryButtonText}>Escolher da galeria</Text>
          </Pressable>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.sectionTitle}>Foto analisada</Text>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Ionicons name="camera-outline" size={34} color={COLORS.secondary} />
              <Text style={styles.previewPlaceholderText}>
                A foto usada para identificar a planta aparece aqui.
              </Text>
            </View>
          )}
        </View>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.resultsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Resultado</Text>
            <Text style={styles.sectionMeta}>{saved ? 'Salva no jardim' : 'Aguardando'}</Text>
          </View>

          {analysis ? (
            <View style={styles.resultList}>
              <ResultRow
                icon={<MaterialCommunityIcons name="leaf" size={18} color={COLORS.secondary} />}
                label="Planta identificada"
                value={analysis.plantName}
              />
              <ResultRow
                icon={<Ionicons name="heart-outline" size={18} color={COLORS.primary} />}
                label="Saude"
                value={analysis.health}
              />
              <ResultRow
                icon={<Ionicons name="pulse-outline" size={18} color={COLORS.primary} />}
                label="Vitalidade"
                value={`${analysis.vitality}%`}
              />
              <ResultRow
                icon={<Ionicons name="water-outline" size={18} color={COLORS.secondary} />}
                label="Agua"
                value={`${analysis.water}/10`}
              />
              <ResultRow
                icon={<Ionicons name="sunny-outline" size={18} color={COLORS.tertiaryText} />}
                label="Luz"
                value={`${analysis.light}/10`}
              />
            </View>
          ) : (
            <Text style={styles.emptyResultText}>
              A planta identificada sera adicionada automaticamente ao jardim.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 44,
    gap: 16,
  },
  hero: {
    overflow: 'hidden',
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  heroIconWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: COLORS.tertiarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  captureButton: {
    marginTop: 8,
    width: '100%',
    minHeight: 56,
    borderRadius: 20,
    backgroundColor: COLORS.tertiarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  captureButtonPressed: {
    opacity: 0.86,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonText: {
    color: COLORS.tertiaryText,
    fontSize: 17,
    fontWeight: '900',
  },
  secondaryButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  previewCard: {
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLow,
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceHigh,
  },
  previewPlaceholder: {
    height: 220,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  previewPlaceholderText: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorCard: {
    borderRadius: 18,
    backgroundColor: '#ffdad6',
    padding: 14,
  },
  errorText: {
    color: '#93000a',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  resultsCard: {
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLowest,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(194, 200, 191, 0.5)',
  },
  resultList: {
    gap: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  resultValue: {
    marginTop: 2,
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyResultText: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
