import React, { useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '../../../../components/shell/AppHeader';
import { plantCatalog } from '../../../../features/gardens/catalog';
import type { PlantCatalogCategory, PlantCatalogItem } from '../../../../features/gardens/types';
import { addPlantToGarden, useGardenDetails } from '../../../../features/gardens/store';
import { normalizePlantName } from '../../../../features/gardens/careProfiles';

const categories: { label: string; value: PlantCatalogCategory }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Folhagens', value: 'foliage' },
  { label: 'Resistentes', value: 'resilient' },
];

function CatalogCard({ item, disabled, singleColumn, onAdd }: {
  item: PlantCatalogItem; disabled: boolean; singleColumn: boolean; onAdd: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <View style={[styles.card, (item.featured || singleColumn) && styles.wideCard]}>
      <View style={[styles.photo, item.featured && styles.featuredPhoto]}>
        <Ionicons name="leaf-outline" size={42} color="#476644" />
        {!imageFailed ? <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} onError={() => setImageFailed(true)} /> : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.categoryLabel}>{item.categoryLabel}</Text>
        <Text style={styles.plantName}>{item.name}</Text>
        <Text style={styles.plantSubtitle}>{item.subtitle}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={'Adicionar ' + item.name} accessibilityState={{ disabled }}
          disabled={disabled} onPress={onAdd} style={({ pressed }) => [styles.addButton, disabled && styles.disabled, pressed && styles.pressed]}>
          <Ionicons name="add" size={20} color="#17361d" /><Text style={styles.addText}>Adicionar</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function AddPlantsScreen() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const garden = useGardenDetails(id);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlantCatalogCategory>('all');
  const filteredPlants = useMemo(() => plantCatalog.filter(item => {
    const normalizedQuery = normalizePlantName(query);
    return (selectedCategory === 'all' || item.category === selectedCategory) &&
      (!normalizedQuery || normalizePlantName([item.name, item.subtitle, item.scientificName ?? ''].join(' ')).includes(normalizedQuery));
  }), [query, selectedCategory]);

  const handleAdd = async (item: PlantCatalogItem) => {
    if (!id || !garden || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const plant = await addPlantToGarden(id, item);
      router.replace({ pathname: '/gardens/[id]/plants/[plantId]', params: { id, plantId: plant.id } });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar a planta.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader title="Adicionar plantas" mode="back" onPressLeading={() => { if (!savingRef.current) { if (garden) router.replace({ pathname: '/gardens/[id]', params: { id: garden.id } }); else router.replace('/'); } }} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.gardenLabel}>{garden?.name ?? 'Jardim não encontrado'}</Text>
        <View style={styles.intro}>
          <Text accessibilityRole="header" style={styles.title}>Encontre sua próxima planta</Text>
          <Text style={styles.text}>Escolha no catálogo para adicionar ao jardim. Depois, acompanhe regas e adubações nos detalhes da planta.</Text>
        </View>
        {saveError ? <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text> : null}
        {saving ? <Text accessibilityLiveRegion="polite" style={styles.text}>Salvando planta...</Text> : null}
        <View style={styles.search}>
          <Ionicons name="search-outline" size={20} color="#586653" />
          <TextInput value={query} onChangeText={setQuery} placeholder="Buscar nome ou espécie" accessibilityLabel="Buscar plantas no catálogo"
            placeholderTextColor="#586653" style={styles.searchInput} />
          {query ? <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setQuery('')} style={styles.clearSearch}>
            <Ionicons name="close-circle" size={20} color="#586653" />
          </Pressable> : null}
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catálogo de plantas</Text>
          <Text style={styles.count}>{filteredPlants.length} de {plantCatalog.length}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {categories.map(category => <Pressable key={category.value} accessibilityRole="button"
            accessibilityState={{ selected: selectedCategory === category.value }}
            style={[styles.chip, selectedCategory === category.value && styles.activeChip]} onPress={() => setSelectedCategory(category.value)}>
            <Text style={[styles.chipText, selectedCategory === category.value && styles.activeChipText]}>{category.label}</Text>
          </Pressable>)}
        </ScrollView>
        {filteredPlants.length === 0 ? <View style={styles.empty}>
          <Ionicons name="search-outline" size={32} color="#476644" />
          <Text style={styles.sectionTitle}>Nenhuma planta encontrada</Text>
          <Text style={styles.text}>Tente outro nome ou escolha outra categoria.</Text>
          <Pressable accessibilityRole="button" style={styles.textButton} onPress={() => { setQuery(''); setSelectedCategory('all'); }}>
            <Text style={styles.buttonText}>Limpar filtros</Text>
          </Pressable>
        </View> : null}
        <View style={styles.grid}>
          {filteredPlants.map(item => <CatalogCard key={item.id} item={item} disabled={saving || !garden}
            singleColumn={width < 380 || fontScale > 1.3} onAdd={() => handleAdd(item)} />)}
        </View>
        <View style={styles.analysisNote}>
          <Text style={styles.sectionTitle}>Não encontrou sua planta?</Text>
          <Text style={styles.text}>Identifique por foto com Pl@ntNet e confirme a espécie antes de adicionar. Requer internet.</Text>
          <Pressable accessibilityRole="button" disabled={saving || !garden} accessibilityState={{ disabled: saving || !garden }}
            style={[styles.textButton, (saving || !garden) && styles.disabled]}
            onPress={() => { if (id && garden) router.push({ pathname: '/gardens/[id]/plants/scan', params: { id } }); }}>
            <Ionicons name="camera-outline" size={18} color="#17361d" /><Text style={styles.buttonText}>Identificar por foto</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf9f5' },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, paddingBottom: 40, gap: 18 },
  gardenLabel: { color: '#476644', fontSize: 12, fontWeight: '700' },
  intro: { gap: 10 },
  title: { color: '#17361d', fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.6 },
  text: { color: '#586653', fontSize: 14, lineHeight: 22 },
  error: { color: '#ba1a1a', fontSize: 14, lineHeight: 22 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dce3d5', borderRadius: 16, paddingHorizontal: 14 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15, color: '#17361d', paddingVertical: 14 },
  clearSearch: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  sectionTitle: { color: '#17361d', fontSize: 20, fontWeight: '800' },
  count: { color: '#476644', fontSize: 12, fontWeight: '700', backgroundColor: '#e9efe4', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  categories: { gap: 10 },
  chip: { borderRadius: 24, minHeight: 44, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#e9efe4' },
  activeChip: { backgroundColor: '#17361d' },
  chipText: { color: '#476644', fontSize: 14, fontWeight: '700' },
  activeChipText: { color: '#ffffff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  card: { width: '47%', borderRadius: 22, overflow: 'hidden', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e7e9e0' },
  wideCard: { width: '100%' },
  photo: { height: 170, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9efe4' },
  featuredPhoto: { height: 220 },
  cardBody: { padding: 16, gap: 7 },
  categoryLabel: { color: '#476644', fontSize: 11, fontWeight: '700' },
  plantName: { color: '#17361d', fontSize: 18, lineHeight: 24, fontWeight: '800' },
  plantSubtitle: { color: '#586653', fontSize: 13, lineHeight: 20 },
  addButton: { minHeight: 44, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12, backgroundColor: '#e9efe4', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 5 },
  addText: { color: '#17361d', fontSize: 14, fontWeight: '700' },
  empty: { padding: 22, borderRadius: 22, backgroundColor: '#ffffff', gap: 12 },
  analysisNote: { padding: 20, borderRadius: 22, backgroundColor: '#eef2e8', gap: 10 },
  textButton: { minHeight: 44, paddingVertical: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  buttonText: { color: '#17361d', fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
