import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { fontFamily, palette } from '@/theme';

export function TimerRing({
  secondsLeft,
  total = 45,
  size = 72,
}: {
  secondsLeft: number;
  total?: number;
  size?: number;
}) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total <= 0 ? 0 : Math.min(1, Math.max(0, secondsLeft / total));
  const dash = circumference * ratio;
  const urgent = secondsLeft <= 10;

  return (
    <View
      accessibilityRole="timer"
      accessibilityLabel={`${secondsLeft} seconds left`}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E6E8EE"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={urgent ? palette.coral : palette.midnight}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.labelWrap} pointerEvents="none">
        <Text style={[styles.seconds, urgent && { color: palette.coral }]}>{secondsLeft}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seconds: {
    fontFamily: fontFamily.heading,
    fontSize: 18,
    color: palette.midnight,
  },
});
