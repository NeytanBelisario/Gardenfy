import React, { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Ionicons,
} from '@expo/vector-icons';
import { AppHeader } from '../../components/shell/AppHeader';

import { CreateGardenDraft, GardenEnvironment } from '../../features/gardens/types';
import { createGarden } from '../../features/gardens/store';
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

const iconLabels: Record<GardenIconName, string> = {
  'potted-plant': 'Broto', psychology: 'Natureza', eco: 'Folha', 'wb-sunny': 'Sol',
  'water-drop': 'Gota de água', 'energy-savings-leaf': 'Folha delicada', spa: 'Flor', 'filter-vintage': 'Flor ornamental',
};

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
  const insets = useSafeAreaInsets();
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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

  const handleBack = () => {
    if (savingRef.current) return;
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleCreateGarden = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const nextGarden = await createGarden({ ...draft, imageUrl: '' });
      router.replace({
        pathname: '/gardens/[id]/plants/add',
        params: { id: nextGarden.id },
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar o jardim.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <AppHeader title="Criar jardim" mode="back" onPressLeading={handleBack} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
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
            <Text style={styles.heroStep}>SEU NOVO COMEÇO</Text>
            <Text style={styles.heroTitle}>Dê um lugar ao seu verde.</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Nome do jardim</Text>
          <TextInput
            placeholder="Ex.: Varanda ensolarada"
            accessibilityLabel="Nome do jardim"
            editable={!saving}
            placeholderTextColor={COLORS.textMuted}
            value={draft.name}
            maxLength={120}
            returnKeyType="done"
            onChangeText={(name) => { setDraft((current) => ({ ...current, name })); setSaveError(null); }}
            style={styles.input}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Ambiente</Text>
          <View style={styles.segmentedControl}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: draft.environment === 'indoor', disabled: saving }}
              disabled={saving}
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
                Interno
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: draft.environment === 'outdoor', disabled: saving }}
              disabled={saving}
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
                Externo
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.iconSectionHeader}>
            <Text style={styles.sectionLabel}>Ícone do jardim</Text>
            <Text style={styles.iconCount}>{gardenIconOptions.length} opções</Text>
          </View>

          <View style={styles.iconGrid}>
            {gardenIconOptions.map((icon) => {
              const isActive = draft.icon === icon;

              return (
                <Pressable
                  key={icon}
                  accessibilityRole="button"
                  accessibilityLabel={iconLabels[icon]}
                  accessibilityState={{ selected: isActive, disabled: saving }}
                  disabled={saving}
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
          {saveError ? <Text accessibilityRole="alert" style={{ color: '#ba1a1a' }}>{saveError}</Text> : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Criar jardim" accessibilityState={{ disabled: saving, busy: saving }} style={[styles.primaryButton, saving && { opacity: 0.6 }]} onPress={handleCreateGarden} disabled={saving}>
            <Text style={styles.primaryButtonText}>{saving ? 'Salvando...' : 'Criar jardim'}</Text>
          </Pressable>

          <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }} style={styles.secondaryButton} onPress={handleBack} disabled={saving}>
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 20,
  },
  hero: {
    minHeight: 148,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#17361d',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 54, 29, 0.32)',
  },
  heroCopy: {
    minHeight: 148,
    justifyContent: 'flex-end',
    padding: 20,
    gap: 8,
  },
  heroStep: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 26,
    lineHeight: 32,
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
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '500',
  },
  segmentedControl: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceLow,
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    minWidth: 110,
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
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCount: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconButton: {
    width: '21%',
    aspectRatio: 1,
    minWidth: 56,
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
    minHeight: 44,
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
