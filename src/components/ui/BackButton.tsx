import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';

import { goBackOr } from '@/navigation/goBackOr';

import { Button, type ButtonVariant } from './Button';

type BackButtonProps = {
  label?: string;
  fallback: Href;
  variant?: ButtonVariant;
};

export function BackButton({ label = 'Back', fallback, variant = 'ghost' }: BackButtonProps) {
  const router = useRouter();
  return (
    <Button
      label={label}
      variant={variant}
      accessibilityLabel={label === 'Back' ? 'Go back' : label}
      onPress={() => goBackOr(router, fallback)}
    />
  );
}
