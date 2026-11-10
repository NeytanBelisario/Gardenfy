import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/shell/AppHeader';
import { PlantPhoto } from '../../components/PlantPhoto';
import { GardenIdentityIcon } from '../../features/gardens/icons';
import { GardenManagementDialog, type GardenManagementAction } from '../../features/gardens/GardenManagementDialog';
import { normalizePlantName } from '../../features/gardens/careProfiles';
import { gardenCareCount } from '../../features/gardens/careActivity';
import { PlantWaterIndicator } from '../../features/gardens/PlantWaterIndicator';
import { WaterNowButton } from '../../features/gardens/WaterNowButton';
import { describeWaterStatus, getWaterStatus } from '../../features/gardens/watering';
import { useGardenDetails } from '../../features/gardens/store';
import { colors } from '../../theme/tokens';

export default function GardenDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const garden = useGardenDetails(id);
  const [action, setAction] = useState<GardenManagementAction | null>(null);
  const [query, setQuery] = useState('');
  const plants = useMemo(() => garden?.plants.filter((plant) => normalizePlantName([plant.name, plant.subtitle, plant.species?.scientificName ?? ''].join(' ')).includes(normalizePlantName(query))) ?? [], [garden, query]);
  const thirsty = garden?.plants.filter((plant) => { const state = getWaterStatus(plant).state; return state === 'due' || state === 'overdue'; }).length ?? 0;
  const add = () => { if (garden) router.push({ pathname: '/gardens/[id]/plants/add', params: { id: garden.id } }); };
  return (
    <View style={styles.screen}>
      <AppHeader title={garden?.name ?? 'Jardim'} mode="back" onPressLeading={() => router.replace('/')} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}>
        {garden ? <>
          <View style={styles.hero}>
            <GardenIdentityIcon icon={garden.icon} size={42} color="#c4d9b9" />
            <Text style={styles.eyebrow}>{garden.label}</Text>
            <Text accessibilityRole="header" style={styles.title}>{garden.name}</Text>
            {thirsty ? <View style={styles.heroAlert}><Ionicons name="water" size={16} color={colors.ink} /><Text style={styles.heroAlertText}>{thirsty === 1 ? '1 planta precisa de água hoje' : thirsty + ' plantas precisam de água hoje'}</Text></View> : null}
            <Text style={styles.heroText}>{garden.plantCount} {garden.plantCount === 1 ? 'planta' : 'plantas'} · {gardenCareCount(garden)} {gardenCareCount(garden) === 1 ? 'cuidado registrado' : 'cuidados registrados'}</Text>
          </View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={add} style={styles.primary}><Ionicons name="add" size={20} color={colors.onInk} /><Text style={styles.primaryText}>Adicionar planta</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Editar jardim" onPress={() => setAction({ mode: 'edit' })} style={styles.secondary}><Ionicons name="create-outline" size={20} color={colors.ink} /><Text style={styles.label}>Editar jardim</Text></Pressable>
          </View>
          <Text accessibilityRole="header" style={styles.heading}>Minhas plantas</Text>
          {garden.plantCount > 0 ? <View style={styles.search}>
            <Ionicons name="search-outline" size={20} color={colors.text} />
            <TextInput accessibilityLabel="Buscar plantas neste jardim" placeholder="Buscar suas plantas" value={query} onChangeText={setQuery} style={styles.input} placeholderTextColor={colors.text} />
            {query ? <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setQuery('')} style={styles.clear}><Ionicons name="close-circle" size={22} color={colors.text} /></Pressable> : null}
          </View> : null}
          {plants.map((plant) => {
            const water = getWaterStatus(plant);
            return <View key={plant.id} style={styles.plantCard}>
              <Pressable accessibilityRole="button" accessibilityLabel={'Abrir cuidados de ' + plant.name + '. Água: ' + describeWaterStatus(water)} onPress={() => router.push({ pathname: '/gardens/[id]/plants/[plantId]', params: { id: garden.id, plantId: plant.id } })} style={({ pressed }) => [styles.plantMain, pressed && styles.pressed]}>
              <PlantPhoto uri={plant.imageUrl} compact style={styles.photo} />
              <View style={styles.plantCopy}><Text style={styles.plantName}>{plant.name}</Text>{plant.species?.scientificName ?? plant.subtitle ? <Text style={styles.caption} numberOfLines={1}>{plant.species?.scientificName ?? plant.subtitle}</Text> : null}<PlantWaterIndicator status={water} /></View>
              </Pressable>
              <WaterNowButton gardenId={garden.id} plant={plant} urgent={water.state === 'due' || water.state === 'overdue'} />
            </View>;
          })}
          {!plants.length ? <View style={styles.empty}>
            <Ionicons name={garden.plantCount ? 'search-outline' : 'leaf-outline'} size={44} color={colors.accent} />
            <Text style={styles.heading}>{garden.plantCount ? 'Nenhuma planta com esse nome' : 'Seu jardim está pronto'}</Text>
            <Text style={styles.text}>{garden.plantCount ? 'Tente buscar por outro nome ou pela espécie.' : 'Adicione sua primeira planta pelo catálogo ou identifique por foto. Depois, registre os cuidados aqui.'}</Text>
            <Pressable accessibilityRole="button" onPress={garden.plantCount ? () => setQuery('') : add} style={styles.secondary}><Text style={styles.label}>{garden.plantCount ? 'Limpar busca' : 'Escolher minha primeira planta'}</Text></Pressable>
          </View> : null}
        </> : <View style={styles.empty}><Text style={styles.heading}>Jardim não encontrado</Text><Text style={styles.text}>Ele pode ter sido excluído. Seus outros jardins continuam disponíveis.</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.primary}><Text style={styles.primaryText}>Ver meus jardins</Text></Pressable></View>}
      </ScrollView>
      {garden && action ? <GardenManagementDialog key={action.mode} garden={garden} action={action} onClose={() => setAction(null)} onGardenDeleted={() => router.replace('/')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, gap: 18 },
  hero: { padding: 26, gap: 12, borderRadius: 28, backgroundColor: colors.ink },
  eyebrow: { color: '#c4d9b9', fontSize: 13 },
  title: { color: colors.onInk, fontSize: 32, fontWeight: '800' },
  heroText: { color: '#d6e2d0', fontSize: 14, lineHeight: 23 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primary: { minHeight: 52, backgroundColor: colors.ink, borderRadius: 16, padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.onInk, fontSize: 15, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  secondary: { minHeight: 52, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 16, padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center' },
  heading: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  label: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  text: { color: colors.text, fontSize: 15, lineHeight: 24 },
  caption: { color: colors.text, fontSize: 13, lineHeight: 21 },
  plantMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  plantCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  photo: { width: 64, height: 72, borderRadius: 16 },
  plantCopy: { flex: 1, gap: 6 },
  plantName: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  heroAlert: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#c8ecc1' },
  heroAlertText: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingLeft: 16, borderRadius: 16, backgroundColor: colors.surfaceMuted },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: colors.ink },
  clear: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 16, padding: 24, borderRadius: 24, backgroundColor: colors.surface },
  pressed: { opacity: 0.75 },
});
