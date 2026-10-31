import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen, ScreenScroll } from '@/components/ui';
import { pickPhoto } from '@/services/photo';
import { useToast } from '@/components/ui/Toast';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

export default function ShareScreen() {
  const router = useRouter();
  const toast = useToast();
  const [photo, setPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('God met us around the table tonight. 🙌');

  return (
    <Screen background={palette.midnight} gutter={palette.midnight}>
      <ScreenScroll contentContainerStyle={styles.body}>
        <Text style={styles.title}>Share the moment</Text>
        <View style={styles.frame}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <Text style={styles.placeholder}>Your photo</Text>
          )}
          <Text style={styles.watermark}>WAYFARE</Text>
          <Text style={styles.captionOverlay}>{caption}</Text>
        </View>
        <TextInput
          accessibilityLabel="Caption"
          value={caption}
          onChangeText={setCaption}
          style={styles.input}
          multiline
        />
        <Text style={styles.strip}>Group moments show up as examples on the community screen</Text>
        <Button
          label="Choose a photo"
          variant="secondary"
          onPress={() => {
            void pickPhoto().then((uri) => {
              if (uri) setPhoto(uri);
              else toast.show('Photo library is not available here.');
            });
          }}
        />
        <Button
          label="Post to journey"
          variant="gold"
          onPress={() => {
            toast.show('Saved on this device.');
            router.replace('/home');
          }}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  title: { ...typeScale.h2, color: palette.white },
  frame: {
    height: 280,
    borderRadius: radii.card,
    backgroundColor: '#2A2D42',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  photo: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  placeholder: {
    color: '#C9CDD6',
    fontFamily: fontFamily.body,
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
  },
  watermark: {
    fontFamily: fontFamily.bodySemi,
    color: palette.gold,
    letterSpacing: 1.4,
    fontSize: 12,
  },
  captionOverlay: { fontFamily: fontFamily.headingSemi, color: palette.white, fontSize: 18 },
  input: {
    minHeight: 72,
    borderRadius: radii.md,
    backgroundColor: palette.white,
    padding: spacing.md,
    fontFamily: fontFamily.body,
    fontSize: 16,
  },
  strip: { color: '#C9CDD6', fontFamily: fontFamily.body, fontSize: 13 },
});
