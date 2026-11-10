import React from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { colors, font, minTouch, radius, space } from '../../theme/tokens';
import { PRIVACY_POLICY_URL } from './photoNotice';

const points: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }[] = [
  { icon: 'leaf-outline', text: 'A foto vai para o Pl@ntNet, um serviço de pesquisa francês, só para sugerir a espécie.' },
  { icon: 'location-outline', text: 'Antes de chegar ao Pl@ntNet, apagamos a localização e outros dados gravados na imagem.' },
  { icon: 'server-outline', text: 'O servidor do Gardenfy não guarda a foto. Se você salvar a planta, a foto fica só no seu aparelho.' },
];

/** Aviso mostrado antes da primeira foto enviada para identificação. */
export function PhotoNoticeDialog({ onAccept, onCancel }: { onAccept: () => void; onCancel: () => void }) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.content}>
            <Text accessibilityRole="header" style={styles.title}>Antes da foto</Text>
            <Text style={styles.text}>Para identificar a planta, a foto precisa sair do seu aparelho. Veja o que acontece com ela:</Text>
            {points.map((point) => (
              <View key={point.icon} style={styles.point}>
                <Ionicons name={point.icon} size={22} color={colors.accent} />
                <Text style={styles.pointText}>{point.text}</Text>
              </View>
            ))}
            <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(PRIVACY_POLICY_URL).catch(() => undefined); }} style={styles.link}>
              <Text style={styles.linkText}>Ler a política de privacidade</Text>
              <Ionicons name="open-outline" size={18} color={colors.accent} />
            </Pressable>
            <Button label="Entendi, continuar" icon="camera-outline" onPress={onAccept} />
            <Button label="Agora não" variant="secondary" onPress={onCancel} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,28,17,0.5)', justifyContent: 'center', alignItems: 'center', padding: space.xxl },
  dialog: { width: '100%', maxWidth: 440, maxHeight: '90%', backgroundColor: colors.background, borderRadius: radius.xl },
  content: { padding: space.xxl, gap: space.md },
  title: { fontSize: font.title, fontWeight: '800', color: colors.ink },
  text: { fontSize: font.body, lineHeight: 23, color: colors.text },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  pointText: { flex: 1, fontSize: font.body, lineHeight: 22, color: colors.textLead },
  link: { minHeight: minTouch, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  linkText: { color: colors.accent, fontSize: font.body, fontWeight: '700', textDecorationLine: 'underline' },
});
