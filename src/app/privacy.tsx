import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '../components/shell/AppHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PRIVACY_POLICY_URL } from '../features/privacy/photoNotice';
import { colors, font, space } from '../theme/tokens';

type Section = { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; items: string[] };

// Resumo da docs/PRIVACY.md. Mudou algo lá? Atualize aqui também.
const sections: Section[] = [
  {
    icon: 'phone-portrait-outline',
    title: 'Fica só no seu aparelho',
    items: [
      'Jardins, plantas, apelidos e fotos.',
      'Regas, adubações e o histórico de cada planta.',
      'Lembretes: agendados no próprio aparelho, sem servidor.',
    ],
  },
  {
    icon: 'cloud-upload-outline',
    title: 'Sai do aparelho só quando você usa',
    items: [
      'Identificar por foto: a foto vai ao Pl@ntNet, sem localização e outros dados gravados na imagem. O servidor do Gardenfy não guarda a foto.',
      'Estimativa da IA: só o nome da espécie vai ao Gemini (Google), quando ela não tem ficha no app. A resposta fica salva por espécie, sem ligação com você.',
      'Contra abuso: o servidor guarda um código derivado do seu IP, nunca o IP em si, por até 2 dias.',
    ],
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'O que não fazemos',
    items: ['Não há conta, anúncios nem rastreamento de uso.', 'Nenhum dado é vendido.'],
  },
  {
    icon: 'trash-outline',
    title: 'Como apagar',
    items: [
      'Exclua plantas ou jardins pelo próprio app.',
      'Para apagar tudo, limpe os dados do Gardenfy nas configurações do Android ou desinstale o app.',
      'Sem conta e sem backup, apagar aqui apaga de vez.',
    ],
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <AppHeader title="Seus dados" mode="back" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: space.xxl + insets.bottom }]}>
        <Text style={styles.lead}>O Gardenfy usa o mínimo de dados para cuidar das suas plantas. Este é o resumo; a política completa tem todos os detalhes.</Text>
        {sections.map((section) => (
          <Card key={section.title}>
            <View style={styles.heading}>
              <Ionicons name={section.icon} size={24} color={colors.accent} />
              <Text accessibilityRole="header" style={styles.title}>{section.title}</Text>
            </View>
            {section.items.map((item) => (
              <View key={item} style={styles.item}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.text}>{item}</Text>
              </View>
            ))}
          </Card>
        ))}
        <Button label="Ler a política completa" icon="open-outline" variant="secondary"
          onPress={() => { void Linking.openURL(PRIVACY_POLICY_URL).catch(() => undefined); }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: space.xl, gap: space.lg },
  lead: { color: colors.textLead, fontSize: font.lead, lineHeight: 24 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { flex: 1, color: colors.ink, fontSize: font.lead + 2, fontWeight: '800' },
  item: { flexDirection: 'row', gap: space.sm },
  bullet: { color: colors.accent, fontSize: font.body, lineHeight: 22 },
  text: { flex: 1, color: colors.text, fontSize: font.body, lineHeight: 22 },
});
