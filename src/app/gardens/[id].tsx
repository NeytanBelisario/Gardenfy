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
import { formatCareDay, gardenCareCount, lastPlantCare } from '../../features/gardens/careActivity';
import { careLabels } from '../../features/gardens/plantHistory';
import { useGardenDetails } from '../../features/gardens/store';

export default function GardenDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const garden = useGardenDetails(id);
  const [action, setAction] = useState<GardenManagementAction | null>(null);
  const [query, setQuery] = useState('');
  const plants = useMemo(() => garden?.plants.filter((plant) => normalizePlantName([plant.name, plant.subtitle, plant.species?.scientificName ?? ''].join(' ')).includes(normalizePlantName(query))) ?? [], [garden, query]);
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
            <Text style={styles.heroText}>{garden.plantCount} {garden.plantCount === 1 ? 'planta' : 'plantas'} · {gardenCareCount(garden)} cuidados registrados</Text>
          </View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={add} style={styles.primary}><Ionicons name="add" size={20} color="#fff" /><Text style={styles.primaryText}>Adicionar planta</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Editar jardim" onPress={() => setAction({ mode: 'edit' })} style={styles.secondary}><Ionicons name="create-outline" size={20} color="#17361d" /><Text style={styles.label}>Editar jardim</Text></Pressable>
          </View>
          <Text accessibilityRole="header" style={styles.heading}>Minhas plantas</Text>
          {garden.plantCount > 0 ? <View style={styles.search}>
            <Ionicons name="search-outline" size={20} color="#586653" />
            <TextInput accessibilityLabel="Buscar plantas neste jardim" placeholder="Buscar suas plantas" value={query} onChangeText={setQuery} style={styles.input} placeholderTextColor="#586653" />
            {query ? <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setQuery('')} style={styles.clear}><Ionicons name="close-circle" size={22} color="#586653" /></Pressable> : null}
          </View> : null}
          {plants.map((plant) => {
            const lastCare = lastPlantCare(plant);
            return <Pressable key={plant.id} accessibilityRole="button" accessibilityLabel={'Abrir cuidados de ' + plant.name} onPress={() => router.push({ pathname: '/gardens/[id]/plants/[plantId]', params: { id: garden.id, plantId: plant.id } })} style={({ pressed }) => [styles.plantCard, pressed && styles.pressed]}>
              <PlantPhoto uri={plant.imageUrl} compact style={styles.photo} />
              <View style={styles.plantCopy}><Text style={styles.plantName}>{plant.name}</Text><Text style={styles.caption}>{plant.species?.scientificName ?? plant.subtitle}</Text><Text style={styles.caption}>{lastCare ? careLabels[lastCare.careType] + ' · ' + formatCareDay(lastCare.occurredAt) : 'Pronta para o primeiro cuidado'}</Text><Text style={styles.open}>Ver planta e registrar cuidados</Text></View>
              <Ionicons name="chevron-forward" size={20} color="#476644" />
            </Pressable>;
          })}
          {!plants.length ? <View style={styles.empty}>
            <Ionicons name={garden.plantCount ? 'search-outline' : 'leaf-outline'} size={44} color="#476644" />
            <Text style={styles.heading}>{garden.plantCount ? 'Nenhuma planta com esse nome' : 'Seu jardim está pronto'}</Text>
            <Text style={styles.text}>{garden.plantCount ? 'Tente buscar por outro nome ou pela espécie.' : 'Adicione sua primeira planta pelo catálogo ou identifique por foto. Depois, registre os cuidados aqui.'}</Text>
            <Pressable accessibilityRole="button" onPress={garden.plantCount ? () => setQuery('') : add} style={styles.secondary}><Text style={styles.label}>{garden.plantCount ? 'Limpar busca' : 'Escolher minha primeira planta'}</Text></Pressable>
          </View> : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Excluir jardim e suas plantas" onPress={() => setAction({ mode: 'delete' })} style={styles.delete}><Text style={styles.deleteText}>Excluir jardim</Text></Pressable>
        </> : <View style={styles.empty}><Text style={styles.heading}>Jardim não encontrado</Text><Text style={styles.text}>Ele pode ter sido excluído. Seus outros jardins continuam disponíveis.</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.primary}><Text style={styles.primaryText}>Ver meus jardins</Text></Pressable></View>}
      </ScrollView>
      {garden && action ? <GardenManagementDialog key={action.mode} garden={garden} action={action} onClose={() => setAction(null)} onGardenDeleted={() => router.replace('/')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf9f5' },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, gap: 18 },
  hero: { padding: 26, gap: 12, borderRadius: 28, backgroundColor: '#17361d' },
  eyebrow: { color: '#c4d9b9', fontSize: 13 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800' },
  heroText: { color: '#d6e2d0', fontSize: 14, lineHeight: 23 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primary: { minHeight: 52, backgroundColor: '#17361d', borderRadius: 16, padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  secondary: { minHeight: 52, borderWidth: 1, borderColor: '#c2c8bf', borderRadius: 16, padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center' },
  heading: { color: '#17361d', fontSize: 22, fontWeight: '800' },
  label: { color: '#17361d', fontSize: 15, fontWeight: '700' },
  text: { color: '#586653', fontSize: 15, lineHeight: 24 },
  caption: { color: '#586653', fontSize: 13, lineHeight: 21 },
  plantCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7e9e0' },
  photo: { width: 64, height: 84, borderRadius: 16 },
  plantCopy: { flex: 1, gap: 5 },
  plantName: { color: '#17361d', fontSize: 18, fontWeight: '800' },
  open: { color: '#476644', fontSize: 12, fontWeight: '700', lineHeight: 20 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingLeft: 16, borderRadius: 16, backgroundColor: '#eef2e8' },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#17361d' },
  clear: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 16, padding: 24, borderRadius: 24, backgroundColor: '#fff' },
  delete: { minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center', padding: 12 },
  deleteText: { color: '#93000a', fontSize: 14 },
  pressed: { opacity: 0.75 },
});
