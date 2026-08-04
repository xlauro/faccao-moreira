import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const HomeActionButtons: React.FC = () => {
  const router = useRouter();

  return (
    <View className="flex-row mb-5">
      <TouchableOpacity
        onPress={() => router.push('/create-service')}
        className="flex-1 bg-brand-burgundy py-3.5 rounded-xl shadow-sm mr-2 flex-row justify-center items-center"
      >
        <Ionicons name="add-circle-outline" size={18} color="#fff" className="mr-1.5" />
        <Text className="text-white font-bold text-sm">+ Novo Serviço</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/suppliers')}
        className="flex-1 bg-white border border-brand-burgundy py-3.5 rounded-xl shadow-sm flex-row justify-center items-center"
      >
        <Text className="text-sm mr-1.5">🏬</Text>
        <Text className="text-brand-burgundy font-bold text-sm">Fornecedores</Text>
      </TouchableOpacity>
    </View>
  );
};
