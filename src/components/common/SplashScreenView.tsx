import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SplashScreenViewProps {
  message?: string;
}

export const SplashScreenView: React.FC<SplashScreenViewProps> = ({
  message = 'Carregando dados da facção...',
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900 }),
        withTiming(1, { duration: 900 })
      ),
      -1,
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0.6, { duration: 900 })
      ),
      -1,
      true
    );
  }, [scale, opacity]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <LinearGradient
      colors={['#2C1435', '#3B1B47', '#1A0B20']}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <View className="items-center px-8">
        {/* Glow Ring Behind Logo */}
        <Animated.View
          style={animatedGlowStyle}
          className="absolute w-36 h-36 rounded-full bg-[#8B2E67]/25 blur-xl"
        />

        {/* Pulsing Central Logo Badge */}
        <Animated.View
          style={animatedLogoStyle}
          className="w-28 h-28 rounded-3xl bg-[#4A2058] border-2 border-[#8B2E67] justify-center items-center shadow-2xl mb-6"
        >
          <Text className="text-5xl">🧵</Text>
        </Animated.View>

        {/* App Title & Tagline */}
        <Text className="text-white text-2xl font-extrabold tracking-wider mb-1 text-center">
          FACÇÃO MOREIRA
        </Text>
        <View className="h-0.5 w-12 bg-emerald-500 rounded-full mb-3" />
        <Text className="text-gray-300 text-xs font-semibold tracking-wider text-center mb-10">
          GESTÃO DE PRODUÇÃO DE COSTURA
        </Text>

        {/* Loading Spinner & Message */}
        <View className="bg-white/10 px-5 py-3 rounded-2xl flex-row items-center border border-white/10 shadow-sm">
          <ActivityIndicator size="small" color="#A855F7" className="mr-3" />
          <Text className="text-gray-200 text-xs font-medium">{message}</Text>
        </View>
      </View>

      {/* Footer Version Info */}
      <View className="absolute bottom-10 items-center">
        <Text className="text-gray-400 text-[11px]">v1.0 • Facção Moreira</Text>
      </View>
    </LinearGradient>
  );
};
