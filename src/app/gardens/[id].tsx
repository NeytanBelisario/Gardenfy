import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GardenIdentityIcon } from '../../features/gardens/icons';
import { GardenManagementDialog, type GardenManagementAction } from '../../features/gardens/GardenManagementDialog';
import { GardenPlantCard } from '../../features/gardens/GardenPlantCard';
import { LightSpotDialog } from '../../features/gardens/LightSpotDialog';
import { normalizePlantName } from '../../features/gardens/careProfiles';
import { gardenCareCount } from '../../features/gardens/careActivity';
import { compareWaterUrgency, getWaterStatus } from '../../features/gardens/watering';
import { useGardenDetails } from '../../features/gardens/store';
import { colors } from '../../theme/tokens';

/** The search box only earns its space once the list gets long. */
const SEARCH_FROM = 6;
const heroGradient = 'linear-gradient(160deg, #2a5230 0%, #17361d 55%, #10281a 100%)';

function HeroButton({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4} style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}>
      <Ionicons name={icon} size={24} color={colors.onInk} />
    </Pressable>
  );
}

export default function GardenDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const garden = useGardenDetails(id);
  const [action, setAction] = useState<GardenManagementAction | null>(null);
  const [lightPlantId, setLightPlantId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const plants = useMemo(() => {
    const matching = garden?.plants.filter((plant) => normalizePlantName([plant.name, plant.subtitle, plant.species?.scientificName ?? ''].join(' ')).includes(normalizePlantName(query))) ?? [];
    return matching.map((plant) => ({ plant, water: getWaterStatus(plant) })).sort((a, b) => compareWaterUrgency(a.water, b.water)).map((item) => item.plant);
  }, [garden, query]);
  const thirsty = garden?.plants.filter((plant) => { const state = getWaterStatus(plant).state; return state === 'due' || state === 'overdue'; }).length ?? 0;
  const lightPlant = garden?.plants.find((plant) => plant.id === lightPlantId);
  const careCount = garden ? gardenCareCount(garden) : 0;
  const add = () => { if (garden) router.push({ pathname: '/gardens/[id]/plants/add', params: { id: garden.id } }); };
  const identify = () => { if (garden) router.push({ pathname: '/gardens/[id]/plants/scan', params: { id: garden.id } }); };
  return (
    <View style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}>
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <Ionicons name="leaf" size={260} color="#5f8f55" style={styles.leafBig} />
          <Ionicons name="leaf" size={150} color="#5f8f55" style={styles.leafSmall} />
          <View style={styles.inner}>
            <View style={styles.topBar}>
              <HeroButton icon="chevron-back" label="Voltar aos jardins" onPress={() => router.replace('/')} />
              <HeroButton icon="person-outline" label="Abrir meu espaço" onPress={() => router.push('/profile')} />
            </View>
            {garden ? <View style={styles.heroCopy}>
              <GardenIdentityIcon icon={garden.icon} size={40} color="#a9cf9a" />
              <Text style={styles.eyebrow}>{garden.label}</Text>
              <View style={styles.nameRow}>
                <Text accessibilityRole="header" style={styles.title}>{garden.name}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Editar jardim" onPress={() => setAction({ mode: 'edit' })} hitSlop={8} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
                  <Ionicons name="pencil" size={16} color={colors.onInk} />
                </Pressable>
              </View>
              <Text style={styles.heroText}>{careCount ? careCount + (careCount === 1 ? ' cuidado registrado' : ' cuidados registrados') : 'Nenhum cuidado registrado ainda'}</Text>
              {thirsty ? <View style={styles.heroAlert}><Ionicons name="water" size={16} color={colors.ink} /><Text style={styles.heroAlertText}>{thirsty === 1 ? '1 planta precisa de água hoje' : thirsty + ' plantas precisam de água hoje'}</Text></View> : null}
            </View> : null}
          </View>
        </View>

        <View style={styles.inner}>
          {garden ? <>
            <View style={styles.tiles}>
              <Pressable accessibilityRole="button" onPress={add} style={({ pressed }) => [styles.tile, styles.tilePrimary, pressed && styles.pressed]}>
                <Ionicons name="add" size={30} color={colors.onInk} /><Text style={styles.tilePrimaryText}>Adicionar planta</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={identify} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
                <Ionicons name="scan-outline" size={28} color={colors.ink} /><Text style={styles.tileText}>Identificar por foto</Text>
              </Pressable>
            </View>

            <View style={styles.list}>
              <View style={styles.listHeader}>
                <Text accessibilityRole="header" style={styles.heading}>Plantas do jardim</Text>
                {garden.plantCount ? <Text accessibilityLabel={garden.plantCount === 1 ? '1 planta' : garden.plantCount + ' plantas'} style={styles.count}>{garden.plantCount}</Text> : null}
              </View>
              {garden.plantCount >= SEARCH_FROM || query ? <View style={styles.search}>
                <Ionicons name="search-outline" size={20} color={colors.text} />
                <TextInput accessibilityLabel="Buscar plantas neste jardim" placeholder="Buscar suas plantas" value={query} onChangeText={setQuery} style={styles.input} placeholderTextColor={colors.text} />
                {query ? <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setQuery('')} style={styles.clear}><Ionicons name="close-circle" size={22} color={colors.text} /></Pressable> : null}
              </View> : null}
              {garden.plantCount > 1 && !query ? <Text style={styles.caption}>Quem precisa de água aparece primeiro</Text> : null}
              {plants.map((plant) => <GardenPlantCard key={plant.id} gardenId={garden.id} plant={plant}
                onOpen={() => router.push({ pathname: '/gardens/[id]/plants/[plantId]', params: { id: garden.id, plantId: plant.id } })}
                onLight={() => setLightPlantId(plant.id)} />)}
              {!plants.length ? <View style={styles.empty}>
                <Ionicons name={garden.plantCount ? 'search-outline' : 'leaf-outline'} size={44} color={colors.accent} />
                <Text style={styles.heading}>{garden.plantCount ? 'Nenhuma planta com esse nome' : 'Seu jardim está pronto'}</Text>
                <Text style={styles.text}>{garden.plantCount ? 'Tente buscar por outro nome ou pela espécie.' : 'Adicione sua primeira planta pelo catálogo ou identifique por foto. Depois, registre os cuidados aqui.'}</Text>
                <Pressable accessibilityRole="button" onPress={garden.plantCount ? () => setQuery('') : add} style={styles.secondary}><Text style={styles.label}>{garden.plantCount ? 'Limpar busca' : 'Escolher minha primeira planta'}</Text></Pressable>
              </View> : null}
            </View>
          </> : <View style={[styles.empty, styles.notFound]}><Text style={styles.heading}>Jardim não encontrado</Text><Text style={styles.text}>Ele pode ter sido excluído. Seus outros jardins continuam disponíveis.</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.primary}><Text style={styles.primaryText}>Ver meus jardins</Text></Pressable></View>}
        </View>
      </ScrollView>
      {garden && action ? <GardenManagementDialog key={action.mode} garden={garden} action={action} onClose={() => setAction(null)} onGardenDeleted={() => router.replace('/')} /> : null}
      {garden && lightPlant ? <LightSpotDialog gardenId={garden.id} plant={lightPlant} onClose={() => setLightPlantId(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  // react-native-web ignores experimental_backgroundImage, so the web build gets the CSS property directly.
  hero: { overflow: 'hidden', paddingBottom: 64, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, backgroundColor: colors.ink, ...Platform.select<object>({ web: { backgroundImage: heroGradient }, default: { experimental_backgroundImage: heroGradient } }) },
  leafBig: { position: 'absolute', right: -80, top: -10, opacity: 0.22, transform: [{ rotate: '-30deg' }], pointerEvents: 'none' },
  leafSmall: { position: 'absolute', right: 70, top: 150, opacity: 0.14, transform: [{ rotate: '25deg' }], pointerEvents: 'none' },
  inner: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between' },
  heroButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.12)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.28)' },
  heroCopy: { gap: 8, marginTop: 18, alignItems: 'flex-start' },
  eyebrow: { color: '#c4d9b9', fontSize: 15, marginTop: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  title: { color: colors.onInk, fontSize: 36, fontWeight: '800', letterSpacing: -0.8, flexShrink: 1 },
  editButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.14)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.28)' },
  heroText: { color: '#d6e2d0', fontSize: 15, lineHeight: 22 },
  heroAlert: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#c8ecc1' },
  heroAlertText: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  tiles: { flexDirection: 'row', gap: 12, marginTop: -40 },
  tile: { flex: 1, minHeight: 96, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, boxShadow: '0px 10px 24px rgba(23, 54, 29, 0.14)' },
  tilePrimary: { backgroundColor: colors.ink, borderWidth: 3, borderColor: colors.background },
  tilePrimaryText: { color: colors.onInk, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  tileText: { color: colors.ink, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  list: { gap: 14, marginTop: 28 },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heading: { color: colors.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  count: { overflow: 'hidden', minWidth: 28, textAlign: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.surfaceMuted, color: colors.textLead, fontSize: 14, fontWeight: '700' },
  label: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  text: { color: colors.text, fontSize: 15, lineHeight: 24, textAlign: 'center' },
  caption: { color: colors.textSoft, fontSize: 13, marginTop: -6 },
  primary: { minHeight: 52, backgroundColor: colors.ink, borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.onInk, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  secondary: { minHeight: 52, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingLeft: 16, borderRadius: 16, backgroundColor: colors.surfaceMuted },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: colors.ink },
  clear: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 16, padding: 24, borderRadius: 24, backgroundColor: colors.surface },
  notFound: { marginTop: 24 },
  pressed: { opacity: 0.75 },
});
