import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '../../components/shell/AppHeader';
import { AppNavbar } from '../../components/shell/AppNavbar';
import { useNavbarVisibilityOnScroll } from '../../hooks/useNavbarVisibilityOnScroll';
import { addAnalyzedPlantToGarden, updatePlantAnalysis, useGardenDetails } from '../gardens/store';
import type { PlantAnalysisResult } from '../gardens/types';
import { formatPercent } from '../gardens/metricPresentation';
import { formatHistoryDate } from '../gardens/plantHistory';
import { plantMatchesCatalogChoice } from './plantMatch';
import { usePlantPhotoAnalysis } from './usePlantPhotoAnalysis';

type AnalysisMode = 'general' | 'add' | 'update';

export function PlantAnalysisScreen({ mode = 'general' }: { mode?: AnalysisMode }) {
  const params = useLocalSearchParams<{ id?: string | string[]; plantId?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const plantId = Array.isArray(params.plantId) ? params.plantId[0] : params.plantId;
  return <PhotoAnalysisView key={`${mode}:${id ?? ''}:${plantId ?? ''}`} mode={mode} id={id} plantId={plantId} />;
}

function PhotoAnalysisView({ mode, id, plantId }: { mode: AnalysisMode; id?: string; plantId?: string }) {
  const router = useRouter();
  const garden = useGardenDetails(id);
  const plant = garden?.plants.find((item) => item.id === plantId);
  const flow = usePlantPhotoAnalysis();
  const [review, setReview] = useState<{ result: PlantAnalysisResult; name: string } | null>(null);
  const { navbarHidden, handleNavbarScroll } = useNavbarVisibilityOnScroll();
  const available = mode === 'general' || !!garden && (mode === 'add' || !!plant);
  const busy = flow.phase !== 'idle';
  const analysis = flow.draft?.analysis;
  const reviewedName = review?.result === analysis ? review?.name : undefined;
  const mismatch = plant && analysis && !plantMatchesCatalogChoice({ name: plant.identifiedName ?? plant.name, subtitle: '' }, analysis);
  const photoUri = flow.draft?.photo.uri ?? plant?.imageUrl;
  const save = () => {
    if (!garden || !flow.draft) return;
    const draft = flow.draft;
    void flow.save(async () => {
      if (mode === 'update') {
        if (!plant) throw new Error('Planta não encontrada.');
        await updatePlantAnalysis(garden.id, plant.id, draft.analysis, draft.photo.uri);
      } else {
        await addAnalyzedPlantToGarden(garden.id, draft.analysis, draft.photo.uri, reviewedName ?? draft.analysis.plantName);
      }
    });
  };
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/'); };

  return (
    <View style={styles.screen}>
      <AppHeader title="Analisar planta" mode={mode === 'general' ? 'menu' : 'back'} onPressLeading={back} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} scrollEventThrottle={16} onScroll={(event) => handleNavbarScroll(event.nativeEvent.contentOffset.y)}>
        {available ? (
          <>
            <View style={styles.hero}>
              <Ionicons name="camera-outline" size={42} color="#ffb783" />
              <Text style={styles.heroTitle}>{plant?.name ?? 'Análise por foto'}</Text>
              <Text style={styles.heroText}>Escolha uma foto de uma única planta. Ao analisar, a imagem será enviada ao serviço de IA do Google (Gemini). Os resultados são estimativas, e podem estar incorretos.</Text>
              <Text style={styles.heroText}>{mode === 'general' ? 'Esta tela mostra uma consulta; o resultado não é salvo em um jardim.' : 'Revise o resultado antes de confirmar o salvamento no jardim.'}</Text>
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy, busy }} onPress={() => flow.select('camera')} style={[styles.primary, busy && styles.disabled]}><Text style={styles.primaryText}>Tirar foto</Text></Pressable>
                <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy }} onPress={() => flow.select('gallery')} style={[styles.primary, busy && styles.disabled]}><Text style={styles.primaryText}>Galeria</Text></Pressable>
              </View>
            </View>
            {busy ? <Text accessibilityLiveRegion="polite" style={styles.text}>{flow.phase === 'selecting' ? 'Escolhendo foto...' : flow.phase === 'saving' ? 'Salvando...' : 'Analisando foto...'}</Text> : null}
            {flow.phase === 'analyzing' ? <Pressable accessibilityRole="button" onPress={flow.cancel} style={styles.secondary}><Text style={styles.label}>Cancelar análise</Text></Pressable> : null}
            {flow.error ? <Text accessibilityRole="alert" style={styles.error}>{flow.error}</Text> : null}
            {flow.notice ? <Text accessibilityLiveRegion="polite" style={styles.text}>{flow.notice}</Text> : null}
            {flow.canRetry ? <Pressable accessibilityRole="button" disabled={busy} onPress={flow.retry} style={styles.secondary}><Text style={styles.label}>Tentar analisar esta foto novamente</Text></Pressable> : null}
            {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} accessibilityLabel={flow.draft ? 'Foto do resultado em revisão' : 'Foto atual da planta'} /> : <View style={styles.card}><Text style={styles.text}>Nenhuma foto analisada nesta tela.</Text></View>}
            {analysis ? (
              <View style={styles.card}>
                <Text accessibilityRole="header" style={styles.heading}>Resultado para revisão</Text>
                <Text style={styles.caption}>Estimativas da IA a partir da foto · {mode === 'general' ? 'consulta sem salvamento' : 'ainda não salvo'}</Text>
                <Text style={styles.label}>Identificação sugerida: {analysis.plantName}</Text>
                <Text style={styles.text}>Saúde: {analysis.health}{'\n'}Vitalidade: {analysis.vitality}%{'\n'}Água estimada: {analysis.water}/10{'\n'}Luz estimada: {analysis.light}/10{'\n'}Crescimento estimado: {analysis.growthDays} dias</Text>
                {mismatch ? <Text style={styles.warning}>A identificação sugerida difere da planta cadastrada. Confira se a foto é desta planta antes de confirmar.</Text> : null}
                {mode === 'add' ? (
                  <>
                    <Text style={styles.label}>Nome da planta (você pode corrigir)</Text>
                    <TextInput accessibilityLabel="Nome da planta antes de salvar" style={styles.input} value={reviewedName ?? analysis.plantName} onChangeText={(name) => setReview({ result: analysis, name })} editable={!busy} />
                    <Text style={styles.caption}>O nome escolhido por você será salvo junto da identificação sugerida pela IA.</Text>
                  </>
                ) : null}
                {mode !== 'general' ? <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy, busy }} onPress={save} style={styles.primary}><Text style={styles.primaryText}>{mode === 'update' ? 'Confirmar e salvar análise' : 'Confirmar e adicionar planta'}</Text></Pressable> : null}
                <Pressable accessibilityRole="button" disabled={busy} onPress={flow.discard} style={styles.secondary}><Text style={styles.label}>Descartar resultado</Text></Pressable>
              </View>
            ) : null}
            {plant ? (
              <View style={styles.card}>
                <Text accessibilityRole="header" style={styles.heading}>Dados salvos da planta</Text>
                <Text style={styles.caption}>{plant.lastAnalyzedAt ? `Estimativas da IA · ${formatHistoryDate(plant.lastAnalyzedAt)}` : 'Sem análise salva'}</Text>
                <Text style={styles.text}>Vitalidade: {formatPercent(plant.vitality)}{'\n'}Água: {formatPercent(plant.metrics.find((metric) => metric.kind === 'water')?.value)}{'\n'}Luz: {formatPercent(plant.metrics.find((metric) => metric.kind === 'light')?.value)}</Text>
                <Text style={styles.caption}>Os dados salvos permanecem até você confirmar uma nova análise.</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.card}><Text style={styles.heading}>{mode === 'update' ? 'Planta não encontrada' : 'Jardim não encontrado'}</Text><Text style={styles.text}>Volte e escolha um cadastro disponível.</Text><Pressable accessibilityRole="button" onPress={back} style={styles.secondary}><Text style={styles.label}>Voltar</Text></Pressable></View>
        )}
      </ScrollView>
      {mode === 'general' ? <AppNavbar hidden={navbarHidden} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf9f5' },
  content: { padding: 24, paddingBottom: 112, gap: 16 },
  hero: { backgroundColor: '#17361d', padding: 24, borderRadius: 28, gap: 16 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900' },
  heroText: { color: '#fff', fontSize: 15, lineHeight: 23 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  primary: { padding: 16, borderRadius: 16, backgroundColor: '#ffb783', alignItems: 'center', minWidth: 120 },
  primaryText: { color: '#301400', fontSize: 16, fontWeight: '800' },
  secondary: { padding: 14, borderRadius: 12, borderColor: '#c2c8bf', borderWidth: 1, alignItems: 'center' },
  text: { color: '#17361d', fontSize: 16, lineHeight: 24 },
  label: { color: '#17361d', fontSize: 16, fontWeight: '700' },
  caption: { color: '#424841', fontSize: 13, lineHeight: 20 },
  heading: { color: '#17361d', fontSize: 22, fontWeight: '800' },
  photo: { width: '100%', height: 260, borderRadius: 24, backgroundColor: '#eae8e4' },
  card: { padding: 20, borderRadius: 20, backgroundColor: '#fff', gap: 12 },
  input: { padding: 16, borderRadius: 12, backgroundColor: '#eae8e4', color: '#17361d', fontSize: 16 },
  error: { color: '#93000a', backgroundColor: '#ffdad6', borderRadius: 12, padding: 16, fontSize: 15, lineHeight: 22 },
  warning: { color: '#684400', backgroundColor: '#fff1d6', borderRadius: 12, padding: 16, fontSize: 15, lineHeight: 22 },
  disabled: { opacity: 0.6 },
});
