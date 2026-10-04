import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/shell/AppHeader';
import { AppNavbar } from '../../components/shell/AppNavbar';
import { savePlantIdentification, useGardenDetails, useGardenSummaries } from '../gardens/store';
import { findPlantCareProfile } from '../gardens/careProfiles';
import { usePlantPhotoRequest } from '../plant-analysis/usePlantPhotoRequest';
import { identificationErrorMessage, identifyPlantPhoto } from './identificationService';
import type { PlantCandidate } from './types';

type Mode = 'general' | 'add' | 'update';

export function PlantIdentificationScreen({ mode = 'general' }: { mode?: Mode }) {
  const params = useLocalSearchParams<{ id?: string | string[]; plantId?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const plantId = Array.isArray(params.plantId) ? params.plantId[0] : params.plantId;
  return <IdentificationView key={`${mode}:${id ?? ''}:${plantId ?? ''}`} mode={mode} id={id} plantId={plantId} />;
}

function IdentificationView({ mode, id, plantId }: { mode: Mode; id?: string; plantId?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const gardens = useGardenSummaries();
  const [chosenGarden, setChosenGarden] = useState<string>();
  const gardenId = id ?? chosenGarden ?? (gardens.length === 1 ? gardens[0].id : undefined);
  const garden = useGardenDetails(gardenId);
  const plant = garden?.plants.find((item) => item.id === plantId);
  const flow = usePlantPhotoRequest(identifyPlantPhoto, identificationErrorMessage);
  const scroll = useRef<ScrollView>(null);
  const lastScrolledDraft = useRef<typeof flow.draft>(null);
  const [review, setReview] = useState<{ candidates: PlantCandidate[]; index: number; name: string }>();
  const busy = flow.phase !== 'idle';
  const candidates = flow.draft?.result;
  const selection = review?.candidates === candidates ? review : undefined;
  const candidate = candidates?.[selection?.index ?? 0];
  const name = selection?.name ?? candidate?.commonName ?? '';
  const profile = candidate ? findPlantCareProfile(candidate.scientificName) : undefined;
  const available = !!garden && (mode !== 'update' || !!plant);
  const back = () => { if (!busy) { if (router.canGoBack()) router.back(); else router.replace('/'); } };
  const catalog = () => { if (garden) router.push({ pathname: '/gardens/[id]/plants/add', params: { id: garden.id } }); };
  const save = () => {
    if (!garden || !flow.draft || !candidate) return;
    const draft = flow.draft;
    void flow.save(async () => {
      const saved = await savePlantIdentification(garden.id, candidate, draft.photo.uri, mode === 'update' && plant ? plant.name : name, plant?.id);
      router.replace({ pathname: '/gardens/[id]/plants/[plantId]', params: { id: garden.id, plantId: saved.id } });
    });
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <AppHeader title="Identificar planta" mode={mode === 'general' ? 'menu' : 'back'} onPressLeading={back} />
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: mode === 'general' ? 140 + insets.bottom : 32 + insets.bottom }]}>
        <View style={styles.hero}>
          <Text accessibilityRole="header" style={styles.title}>Qual é a sua planta?</Text>
          <Text style={styles.heroText}>Escolha uma foto nítida de uma folha ou flor. Enviamos a imagem ao Pl@ntNet e você confirma a espécie antes de salvar.</Text>
        </View>
        {mode === 'general' && gardens.length > 1 ? (
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.heading}>Em qual jardim?</Text>
            {gardens.map((item) => <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={item.name} accessibilityState={{ checked: gardenId === item.id, disabled: busy }} disabled={busy} onPress={() => setChosenGarden(item.id)} style={[styles.choice, gardenId === item.id && styles.selected]}>
              <Ionicons name={gardenId === item.id ? 'radio-button-on' : 'radio-button-off'} size={20} color="#476644" /><Text style={styles.choiceText}>{item.name}</Text>
            </Pressable>)}
          </View>
        ) : null}
        {available ? (
          <>
            <Text style={styles.caption}>{plant ? `Atualizar identificação de ${plant.name}` : `Adicionar em ${garden.name}`}</Text>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Tirar foto" disabled={busy} accessibilityState={{ disabled: busy }} onPress={() => flow.select('camera')} style={[styles.primary, busy && styles.disabled]}><Ionicons name="camera-outline" size={22} color="#fff" /><Text style={styles.primaryText}>Tirar foto</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Escolher foto da galeria" disabled={busy} accessibilityState={{ disabled: busy }} onPress={() => flow.select('gallery')} style={[styles.secondary, busy && styles.disabled]}><Ionicons name="images-outline" size={22} color="#17361d" /><Text style={styles.label}>Galeria</Text></Pressable>
            </View>
            {busy ? <View style={styles.loading}><ActivityIndicator color="#476644" /><Text accessibilityLiveRegion="polite" style={styles.text}>{flow.phase === 'saving' ? 'Guardando sua planta...' : flow.phase === 'selecting' ? 'Escolhendo foto...' : 'Buscando espécies parecidas...'}</Text></View> : null}
            {flow.phase === 'analyzing' ? <Pressable accessibilityRole="button" onPress={flow.cancel} style={styles.secondary}><Text style={styles.label}>Cancelar identificação</Text></Pressable> : null}
            {flow.error ? <Text accessibilityRole="alert" style={styles.error}>{flow.error}</Text> : null}
            {flow.notice ? <Text accessibilityLiveRegion="polite" style={styles.text}>{flow.notice}</Text> : null}
            {flow.canRetry ? <Pressable accessibilityRole="button" disabled={busy} onPress={flow.retry} style={styles.secondary}><Text style={styles.label}>Tentar novamente com esta foto</Text></Pressable> : null}
            {flow.draft && candidates && candidate ? (
              <View style={styles.card} onLayout={(event) => {
                if (lastScrolledDraft.current !== flow.draft) {
                  lastScrolledDraft.current = flow.draft;
                  scroll.current?.scrollTo({ y: event.nativeEvent.layout.y, animated: true });
                }
              }}>
                <Image source={{ uri: flow.draft.photo.uri }} style={styles.photo} accessibilityLabel="Foto da planta em revisão" />
                <Text accessibilityRole="header" style={styles.heading}>Confira a espécie</Text>
                <Text style={styles.caption}>As sugestões podem estar incorretas. A pontuação indica confiança na identificação, sem avaliar a saúde da planta.</Text>
                {candidates.map((item, index) => <Pressable key={item.scientificName} accessibilityRole="radio" accessibilityLabel={`${item.commonName}, ${item.scientificName}, ${Math.round(item.confidence * 100)}% de confiança`} accessibilityState={{ checked: item === candidate, disabled: busy }} disabled={busy} onPress={() => setReview({ candidates, index, name: item.commonName })} style={[styles.choice, item === candidate && styles.selected]}>
                  <Ionicons name={item === candidate ? 'radio-button-on' : 'radio-button-off'} size={22} color="#476644" />
                  <View style={styles.choiceCopy}><Text style={styles.label}>{item.commonName}</Text><Text style={styles.caption}>{item.scientificName}</Text><Text style={styles.caption}>{Math.round(item.confidence * 100)}% de confiança</Text></View>
                </Pressable>)}
                {candidate.confidence < 0.5 ? <Text style={styles.warning}>A confiança é baixa. Confira a espécie ou tente uma foto mais nítida antes de salvar.</Text> : null}
                {mode === 'update' && plant?.species && plant.species.scientificName !== candidate.scientificName ? <Text style={styles.warning}>Esta espécie difere da identificação salva. Confira se a foto é da mesma planta.</Text> : null}
                <Text style={styles.label}>{profile ? 'Ficha de cuidados disponível' : 'Ainda sem ficha de cuidados'}</Text>
                <Text style={styles.text}>{profile?.description ?? 'Você pode salvar a espécie e registrar os cuidados. As orientações específicas ainda não estão no nosso catálogo.'}</Text>
                {mode !== 'update' ? <><Text style={styles.label}>Como quer chamar sua planta?</Text><TextInput accessibilityLabel="Nome da planta" value={name} maxLength={120} onChangeText={(value) => setReview({ candidates, index: selection?.index ?? 0, name: value })} editable={!busy} style={styles.input} /></> : null}
                <Pressable accessibilityRole="button" accessibilityLabel={mode === 'update' ? 'Confirmar identificação' : 'Confirmar e adicionar planta'} disabled={busy || !name.trim()} accessibilityState={{ disabled: busy || !name.trim(), busy: flow.phase === 'saving' }} onPress={save} style={[styles.primary, (busy || !name.trim()) && styles.disabled]}><Text style={styles.primaryText}>{mode === 'update' ? 'Confirmar identificação' : 'Confirmar e adicionar planta'}</Text></Pressable>
                <Pressable accessibilityRole="button" disabled={busy} onPress={flow.discard} style={styles.secondary}><Text style={styles.label}>Descartar e escolher outra foto</Text></Pressable>
              </View>
            ) : null}
            {mode !== 'update' ? <Pressable accessibilityRole="button" disabled={busy} onPress={catalog} style={styles.secondary}><Ionicons name="leaf-outline" size={20} color="#476644" /><Text style={styles.label}>Escolher pelo catálogo</Text></Pressable> : null}
          </>
        ) : !gardens.length && mode === 'general' ? (
          <View style={styles.card}><Text style={styles.heading}>Primeiro, um lugar para sua planta</Text><Text style={styles.text}>Crie seu jardim para guardar as plantas identificadas e acompanhar seus cuidados.</Text><Pressable accessibilityRole="button" onPress={() => router.push('/gardens/new')} style={styles.primary}><Text style={styles.primaryText}>Criar meu primeiro jardim</Text></Pressable></View>
        ) : mode === 'general' ? <Text style={styles.text}>Escolha um jardim acima para começar.</Text> : (
          <View style={styles.card}><Text style={styles.heading}>{mode === 'update' ? 'Planta não encontrada' : 'Jardim não encontrado'}</Text><Pressable accessibilityRole="button" onPress={back} style={styles.secondary}><Text style={styles.label}>Voltar aos jardins</Text></Pressable></View>
        )}
        <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL('https://my.plantnet.org/').catch(() => undefined); }} style={styles.credit}>
          <Image source={require('../../../assets/images/powered-by-plantnet.png')} style={styles.creditLogo} resizeMode="contain" accessibilityLabel="Powered by Pl@ntNet" />
          <Text style={styles.caption}>Identificação de espécies baseada na API Pl@ntNet, atualizada regularmente. Conheça o projeto ↗</Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
      {mode === 'general' ? <AppNavbar /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf9f5' },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, gap: 16 },
  hero: { backgroundColor: '#17361d', borderRadius: 24, padding: 20, gap: 10 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  heroText: { color: '#d6e2d0', fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  primary: { minHeight: 52, backgroundColor: '#17361d', borderRadius: 16, padding: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  secondary: { minHeight: 52, borderWidth: 1, borderColor: '#c2c8bf', borderRadius: 16, padding: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8 },
  label: { color: '#17361d', fontSize: 16, fontWeight: '700', flexShrink: 1 },
  heading: { color: '#17361d', fontSize: 22, fontWeight: '800' },
  text: { color: '#586653', fontSize: 15, lineHeight: 24 },
  caption: { color: '#586653', fontSize: 13, lineHeight: 21 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, gap: 14, borderWidth: 1, borderColor: '#e7e9e0' },
  photo: { height: 220, width: '100%', borderRadius: 16, backgroundColor: '#eef2e8' },
  input: { minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: '#c2c8bf', padding: 16, fontSize: 16, color: '#17361d' },
  choice: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e7e9e0', padding: 16 },
  selected: { backgroundColor: '#eef2e8', borderColor: '#476644' },
  choiceCopy: { flex: 1, gap: 4 },
  choiceText: { flex: 1, fontSize: 16, color: '#17361d' },
  error: { color: '#93000a', backgroundColor: '#ffdad6', borderRadius: 16, padding: 16, fontSize: 15, lineHeight: 23 },
  warning: { color: '#684400', backgroundColor: '#fff1d6', borderRadius: 16, padding: 16, fontSize: 15, lineHeight: 23 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  credit: { minHeight: 44, justifyContent: 'center', gap: 8 },
  creditLogo: { width: 180, height: 48 },
  disabled: { opacity: 0.5 },
});
