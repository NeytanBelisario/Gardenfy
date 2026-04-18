import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import { AppHeader } from '../../../../components/shell/AppHeader';
import { mockPlantCatalog } from '../../../../features/gardens/mocks';
import { PlantCatalogCategory, PlantCatalogItem } from '../../../../features/gardens/types';
import { addPlantToGarden, useGardenDetails } from '../../../../features/gardens/store';

const COLORS = {
  background: '#fbf9f5',
  primary: '#17361d',
  primarySoft: '#2e4d32',
  secondary: '#476644',
  tertiarySoft: '#ffb783',
  tertiaryText: '#301400',
  surfaceLow: '#f5f3ef',
  surfaceHigh: '#eae8e4',
  surfaceVariant: '#e4e2de',
  textMuted: '#737971',
  white: '#ffffff',
} as const;

const categoryOptions: Array<{ label: string; value: PlantCatalogCategory }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Samambaias', value: 'ferns' },
  { label: 'Suculentas', value: 'succulents' },
  { label: 'Folhagens', value: 'foliage' },
  { label: 'Arvoretas', value: 'small-trees' },
];

function CatalogCard({
  item,
  onAdd,
}: {
  item: PlantCatalogItem;
  onAdd: () => void;
}) {
  if (item.featured) {
    return (
      <View style={styles.featuredCard}>
        <View style={styles.featuredImageWrap}>
          <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} />
          <Pressable style={styles.featuredAddButton} onPress={onAdd}>
            <Ionicons name="add" size={24} color={COLORS.tertiaryText} />
          </Pressable>
        </View>
        <View style={styles.featuredBody}>
          <Text style={styles.featuredEyebrow}>{item.categoryLabel}</Text>
          <Text style={styles.featuredTitle}>{item.name}</Text>
          <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gridCard}>
      <View style={styles.gridImageWrap}>
        <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
        <Pressable style={styles.gridAddButton} onPress={onAdd}>
          <Ionicons name="add" size={18} color={COLORS.primary} />
        </Pressable>
      </View>
      <View style={styles.gridBody}>
        <Text style={styles.gridTitle}>{item.name}</Text>
        <Text style={styles.gridSubtitle} numberOfLines={2}>
          {item.subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function AddPlantsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const garden = useGardenDetails(id);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlantCatalogCategory>('all');

  const filteredPlants = useMemo(() => {
    return mockPlantCatalog.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.subtitle.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory]);

  const featuredPlant = filteredPlants.find((item) => item.featured);
  const gridPlants = filteredPlants.filter((item) => !item.featured);

  const handleAddPlant = (item: PlantCatalogItem) => {
    if (!id) {
      return;
    }

    addPlantToGarden(id, item);
    router.back();
  };

  return (
    <View style={styles.screen}>
      <AppHeader title="Adicionar Plantas" mode="back" onPressLeading={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.gardenLabel}>{garden?.name ?? 'Jardim de Inverno'}</Text>

        <View style={styles.hero}>
          <View style={styles.heroPlantGhost}>
            <MaterialCommunityIcons name="sprout" size={120} color="rgba(255,255,255,0.06)" />
          </View>

          <View style={styles.heroIconWrap}>
            <MaterialIcons name="auto-awesome" size={34} color={COLORS.tertiarySoft} />
          </View>

          <Text style={styles.heroTitle}>Identificacao Inteligente</Text>
          <Text style={styles.heroSubtitle}>
            Tire uma foto para descobrir a especie e como cuidar dela
            instantaneamente.
          </Text>

          <Pressable style={styles.scanButton}>
            <Ionicons name="camera" size={22} color={COLORS.tertiaryText} />
            <Text style={styles.scanButtonText}>Escanear Planta</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ou busque manualmente por especie..."
            placeholderTextColor="#9aa099"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Curadoria de Verao</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>124 especies</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {categoryOptions.map((category) => {
            const active = selectedCategory === category.value;

            return (
              <Pressable
                key={category.value}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(category.value)}
              >
                <Text
                  style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
                >
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {featuredPlant ? <CatalogCard item={featuredPlant} onAdd={() => handleAddPlant(featuredPlant)} /> : null}

        <View style={styles.gridRow}>
          {gridPlants.map((item) => (
            <CatalogCard key={item.id} item={item} onAdd={() => handleAddPlant(item)} />
          ))}
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
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 18,
  },
  gardenLabel: {
    marginTop: -6,
    color: `${COLORS.secondary}aa`,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 38,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 34,
    alignItems: 'center',
    shadowColor: '#17361d',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  heroPlantGhost: {
    position: 'absolute',
    top: 10,
    right: 8,
  },
  heroIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 16,
    lineHeight: 29,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 260,
  },
  scanButton: {
    marginTop: 22,
    width: '100%',
    borderRadius: 22,
    backgroundColor: COLORS.tertiarySoft,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scanButtonText: {
    color: COLORS.tertiaryText,
    fontSize: 18,
    fontWeight: '900',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchInput: {
    flex: 1,
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  countBadge: {
    backgroundColor: 'rgba(200, 236, 193, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countBadgeText: {
    color: '#9abd9b',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  categoryRow: {
    gap: 12,
    paddingRight: 18,
  },
  categoryChip: {
    borderRadius: 999,
    backgroundColor: COLORS.surfaceHigh,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  featuredCard: {
    overflow: 'hidden',
    borderRadius: 30,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.6)',
  },
  featuredImageWrap: {
    position: 'relative',
    height: 250,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredAddButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.tertiarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBody: {
    padding: 18,
  },
  featuredEyebrow: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  featuredTitle: {
    marginTop: 8,
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  featuredSubtitle: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 15,
    fontStyle: 'italic',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '47%',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 222, 0.6)',
  },
  gridImageWrap: {
    position: 'relative',
    height: 190,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridAddButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(251, 249, 245, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridBody: {
    padding: 14,
  },
  gridTitle: {
    color: COLORS.primary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  gridSubtitle: {
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
