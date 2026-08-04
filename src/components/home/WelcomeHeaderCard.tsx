import React from 'react';
import { Text, View } from 'react-native';

interface WelcomeHeaderCardProps {
  userName?: string;
}

export const WelcomeHeaderCard: React.FC<WelcomeHeaderCardProps> = ({ userName }) => {
  const initial = userName ? userName.trim()[0].toUpperCase() : 'C';

  return (
    <View className="bg-brand-burgundy rounded-2xl p-4 shadow-md mb-4 flex-row items-center">
      <View className="w-12 h-12 rounded-full bg-white/20 justify-center items-center mr-3">
        <Text className="text-white text-xl font-bold">{initial}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white text-lg font-bold">Olá, {userName || 'Costureira'}! 👋</Text>
        <Text className="text-white/80 text-xs mt-0.5">Ateliê de Costura Compartilhado</Text>
      </View>
    </View>
  );
};
