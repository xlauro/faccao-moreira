import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WelcomeHeaderCardProps {
  userName?: string;
  currentVersion?: string;
  hasUpdate?: boolean;
  onCheckUpdate?: () => void;
}

export const WelcomeHeaderCard: React.FC<WelcomeHeaderCardProps> = ({
  userName,
  currentVersion = '1.0.0',
  hasUpdate = false,
  onCheckUpdate,
}) => {
  const initial = userName ? userName.trim()[0].toUpperCase() : 'C';

  return (
    <View className="bg-brand-burgundy rounded-2xl p-4 shadow-md mb-4 flex-row items-center">
      <View className="w-12 h-12 rounded-full bg-white/20 justify-center items-center mr-3">
        <Text className="text-white text-xl font-bold">{initial}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-lg font-bold">Olá, {userName || 'Costureira'}! 👋</Text>
          <TouchableOpacity
            onPress={onCheckUpdate}
            activeOpacity={0.7}
            className={`px-2 py-0.5 rounded-full flex-row items-center ${
              hasUpdate ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            {hasUpdate ? (
              <>
                <Ionicons name="arrow-up-circle" size={12} color="#ffffff" style={{ marginRight: 3 }} />
                <Text className="text-white text-[10px] font-extrabold">Atualizar</Text>
              </>
            ) : (
              <Text className="text-white/90 text-[10px] font-semibold">v{currentVersion}</Text>
            )}
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center mt-0.5">
          <View className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />
          <Text className="text-white/80 text-xs font-medium">Ateliê de Costura Compartilhado • Online</Text>
        </View>
      </View>
    </View>
  );
};
