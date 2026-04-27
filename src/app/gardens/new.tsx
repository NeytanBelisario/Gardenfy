import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Ionicons,
} from '@expo/vector-icons';

import { CreateGardenDraft, GardenEnvironment } from '../../features/gardens/types';
import { createMockGarden } from '../../features/gardens/store';
import {
  GardenIconName,
  GardenIdentityIcon,
  gardenIconOptions,
} from '../../features/gardens/icons';

const COLORS = {
  background: '#fbf9f5',
  primary: '#17361d',
  secondary: '#476644',
  surfaceLow: '#f5f3ef',
  surfaceHigh: '#eae8e4',
  tertiarySoft: '#ffb783',
  tertiaryText: '#301400',
  textMuted: '#737971',
  white: '#ffffff',
} as const;

function IdentityIcon({
  icon,
  active,
}: {
  icon: GardenIconName;
  active: boolean;
}) {
  const color = active ? COLORS.tertiaryText : COLORS.secondary;
  return <GardenIdentityIcon icon={icon} size={30} color={color} />;
}

export default function NewGardenScreen() {
  const router = useRouter();
  const [draft, setDraft] = useState<CreateGardenDraft>({
    name: '',
    environment: 'indoor',
    icon: 'potted-plant',
  });

  const setEnvironment = (environment: GardenEnvironment) => {
    setDraft((current) => ({ ...current, environment }));
  };

  const setIcon = (icon: GardenIconName) => {
    setDraft((current) => ({ ...current, icon }));
  };

  const handleCreateGarden = () => {
    const nextGarden = createMockGarden({
      ...draft,
      imageUrl: '',
    });

    router.replace({
      pathname: '/gardens/[id]/plants/add',
      params: { id: nextGarden.id },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAg44WsM3e20lqM56FtwGUQO9hTzhapVd-1AdCb0nhBUveRHsPr-KOqieEBAk1S0jbN5an_AIu_tbT2apqvGSwyqR9AjlUOXg9hM0FEhYXkVtzpHyKDqChu4bAn2_RaO0XWgbbYl4_ZRoaQeRJ52WQuWRg5tIiIBU94cKbu0R57gSBXPnx2io0_vCXRuHMphsEmuUS1l_Bbtzt1Bt92QCpiCIG3exqaU8XHwJLXG5KF7h43oof_SS5CZBCZiwW-9xfv9mVnZkjxfOk',
            }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroStep}>Step 1 of 2</Text>
            <Text style={styles.heroTitle}>Curate Your Space</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Garden Name</Text>
          <TextInput
            placeholder="e.g., The Sun-Drenched Balcony"
            placeholderTextColor={COLORS.textMuted}
            value={draft.name}
            onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
            style={styles.input}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Environment</Text>
          <View style={styles.segmentedControl}>
            <Pressable
              style={[
                styles.segmentButton,
                draft.environment === 'indoor' && styles.segmentButtonActive,
              ]}
              onPress={() => setEnvironment('indoor')}
            >
              <Ionicons
                name="home"
                size={18}
                color={draft.environment === 'indoor' ? COLORS.white : COLORS.secondary}
              />
              <Text
                style={[
                  styles.segmentText,
                  draft.environment === 'indoor' && styles.segmentTextActive,
                ]}
              >
                Indoor
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.segmentButton,
                draft.environment === 'outdoor' && styles.segmentButtonActive,
              ]}
              onPress={() => setEnvironment('outdoor')}
            >
              <Ionicons
                name="leaf-outline"
                size={18}
                color={draft.environment === 'outdoor' ? COLORS.white : COLORS.secondary}
              />
              <Text
                style={[
                  styles.segmentText,
                  draft.environment === 'outdoor' && styles.segmentTextActive,
                ]}
              >
                Outdoor
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.iconSectionHeader}>
            <Text style={styles.sectionLabel}>Identity Icon</Text>
            <Text style={styles.iconCount}>24 styles</Text>
          </View>

          <View style={styles.iconGrid}>
            {gardenIconOptions.map((icon) => {
              const isActive = draft.icon === icon;

              return (
                <Pressable
                  key={icon}
                  style={[styles.iconButton, isActive && styles.iconButtonActive]}
                  onPress={() => setIcon(icon)}
                >
                  <View style={styles.iconButtonContent}>
                    <IdentityIcon icon={icon} active={isActive} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={handleCreateGarden}>
            <Text style={styles.primaryButtonText}>Create Garden</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Discard Draft</Text>
          </Pressable>
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
    paddingTop: 12,
    paddingBottom: 40,
    gap: 30,
  },
  hero: {
    height: 330,
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#17361d',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 54, 29, 0.32)',
  },
  heroCopy: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 28,
    gap: 8,
  },
  heroStep: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  formSection: {
    gap: 14,
  },
  sectionLabel: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  input: {
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 22,
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '500',
  },
  segmentedControl: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceLow,
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 16,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.primary,
  },
  segmentText: {
    color: COLORS.secondary,
    fontSize: 17,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: COLORS.white,
  },
  iconSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCount: {
    color: '#97a592',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  iconButton: {
    width: '22%',
    aspectRatio: 1,
    minWidth: 70,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceHigh,
  },
  iconButtonActive: {
    backgroundColor: COLORS.tertiarySoft,
  },
  iconButtonContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    paddingTop: 16,
    gap: 18,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    shadowColor: '#17361d',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2.2,
  },
});
