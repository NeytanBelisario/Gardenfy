import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { AppHeader } from '../../components/shell/AppHeader';
import { AppNavbar } from '../../components/shell/AppNavbar';
import { ENV } from '../../constants/env';
import { useNavbarVisibilityOnScroll } from '../../hooks/useNavbarVisibilityOnScroll';

type PlantaDetectada = {
  tipo: string;
  agua: string;
  iluminacao: string;
  saude?: string;
  saude_atual?: string;
  dicas?: string;
};

const genAI = ENV.geminiApiKey ? new GoogleGenerativeAI(ENV.geminiApiKey) : null;

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
] as const;

async function analisarPlantasDoJardim(
  base64String: string,
  mimeType = 'image/jpeg'
): Promise<PlantaDetectada[]> {
  if (!genAI) {
    console.error('EXPO_PUBLIC_GEMINI_API_KEY nao configurada.');
    return [];
  }

  const generationConfig = {
    responseMimeType: 'application/json',
  };

  const prompt = `Analise a imagem e identifique as plantas.
  Retorne um array JSON: [{"tipo": string, "agua": string, "iluminacao": string, "saude": string}]`;

  const imageParts = [
    {
      inlineData: {
        data: base64String,
        mimeType,
      },
    },
  ];

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }, ...imageParts] }],
        generationConfig,
      });

      const response = result.response;
      console.log('Modelo Gemini utilizado:', modelName);
      return JSON.parse(response.text()) as PlantaDetectada[];
    } catch (error) {
      console.error(`Erro na Chamada com ${modelName}:`, error);
    }
  }

  return [];
}

export function PlantAnalysisScreen() {
  const { navbarHidden, handleNavbarScroll } = useNavbarVisibilityOnScroll();
  const [plantasList, setPlantasList] = useState<PlantaDetectada[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedPhotoUri, setUploadedPhotoUri] = useState<string | null>(null);

  const handleCapture = async (photo: { base64?: string; mimeType?: string }) => {
    if (!photo.base64) {
      console.error('A imagem selecionada nao possui base64.');
      return;
    }

    setLoading(true);

    try {
      const base64Clean = photo.base64.replace(/^data:image\/\w+;base64,/, '');
      const resultado = await analisarPlantasDoJardim(
        base64Clean,
        photo.mimeType ?? 'image/jpeg'
      );

      console.log('Resposta do Gemini:', resultado);
      setPlantasList(resultado);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      console.error('Permissao para acessar a galeria nao foi concedida.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      base64: true,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    setUploadedPhotoUri(asset.uri);

    await handleCapture({
      base64: asset.base64 ?? undefined,
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  };

  return (
    <View style={styles.screen}>
      <AppHeader mode="back" />

      <ScrollView
        contentContainerStyle={styles.container}
        scrollEventThrottle={16}
        onScroll={(event) => handleNavbarScroll(event.nativeEvent.contentOffset.y)}
      >
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Diagnostico rapido</Text>
          </View>
          <Text style={styles.title}>Gardenfy</Text>
          <Text style={styles.subtitle}>
            Envie uma foto do jardim para identificar as plantas e ver os cuidados
            recomendados em uma tela so.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.uploadButton,
              pressed && styles.uploadButtonPressed,
              loading && styles.uploadButtonDisabled,
            ]}
            onPress={handlePickImage}
            disabled={loading}
          >
            <Text style={styles.uploadButtonText}>
              {loading ? 'Analisando foto...' : 'Adicionar foto'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.contentGrid}>
          <View style={styles.previewCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Foto enviada</Text>
              <Text style={styles.sectionMeta}>
                {uploadedPhotoUri ? 'Pronta para analise' : 'Aguardando upload'}
              </Text>
            </View>

            {uploadedPhotoUri ? (
              <Image source={{ uri: uploadedPhotoUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Text style={styles.previewPlaceholderTitle}>Nenhuma imagem ainda</Text>
                <Text style={styles.previewPlaceholderText}>
                  Escolha uma foto da galeria para visualizar aqui e gerar a
                  analise.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.resultsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Resultado</Text>
              <Text style={styles.sectionMeta}>
                {plantasList.length} planta{plantasList.length === 1 ? '' : 's'}
              </Text>
            </View>

            {plantasList.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma planta analisada ainda.</Text>
            ) : (
              plantasList.map((planta, index) => (
                <View key={`${planta.tipo}-${index}`} style={styles.card}>
                  <Text style={styles.cardTitle}>{planta.tipo}</Text>

                  <View style={styles.infoRow}>
                    <Text style={styles.cardLabel}>Agua</Text>
                    <Text style={styles.cardText}>{planta.agua}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.cardLabel}>Iluminacao</Text>
                    <Text style={styles.cardText}>{planta.iluminacao}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.cardLabel}>Saude</Text>
                    <Text style={styles.cardText}>
                      {planta.saude ?? planta.saude_atual ?? '-'}
                    </Text>
                  </View>

                  {planta.dicas ? (
                    <View style={styles.tipBox}>
                      <Text style={styles.tipLabel}>Dica rapida</Text>
                      <Text style={styles.tipText}>{planta.dicas}</Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <AppNavbar hidden={navbarHidden} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef3ea',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 92,
    paddingBottom: 112,
    gap: 20,
    backgroundColor: '#eef3ea',
  },
  hero: {
    backgroundColor: '#24452f',
    borderRadius: 28,
    padding: 22,
    gap: 12,
    shadowColor: '#17301f',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#d9f2c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: '#24452f',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: '#f7fbf5',
    fontSize: 34,
    fontWeight: '700',
  },
  subtitle: {
    color: '#d7e4d8',
    fontSize: 16,
    lineHeight: 23,
  },
  uploadButton: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#b9df74',
    paddingVertical: 16,
    alignItems: 'center',
  },
  uploadButtonPressed: {
    opacity: 0.88,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#1c311f',
    fontSize: 16,
    fontWeight: '700',
  },
  contentGrid: {
    gap: 16,
  },
  previewCard: {
    backgroundColor: '#f8fbf6',
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  resultsCard: {
    backgroundColor: '#f8fbf6',
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: '#213625',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionMeta: {
    color: '#6d7f71',
    fontSize: 13,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 18,
    backgroundColor: '#dde6dc',
  },
  previewPlaceholder: {
    height: 220,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d8e2d3',
    borderStyle: 'dashed',
    backgroundColor: '#f1f6ee',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  previewPlaceholderTitle: {
    color: '#325338',
    fontSize: 18,
    fontWeight: '700',
  },
  previewPlaceholderText: {
    color: '#657467',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyText: {
    color: '#667066',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e4ece0',
  },
  cardTitle: {
    color: '#1f331f',
    fontSize: 19,
    fontWeight: '700',
  },
  infoRow: {
    gap: 4,
  },
  cardLabel: {
    color: '#66836c',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardText: {
    color: '#314231',
    fontSize: 15,
    lineHeight: 21,
  },
  tipBox: {
    borderRadius: 14,
    backgroundColor: '#edf6df',
    padding: 12,
    gap: 4,
  },
  tipLabel: {
    color: '#56712a',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipText: {
    color: '#314231',
    fontSize: 14,
    lineHeight: 20,
  },
});
