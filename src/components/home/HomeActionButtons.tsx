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
        className="flex-1 bg-brand-burgundy py-3 rounded-xl shadow-sm mr-1.5 flex-row justify-center items-center"
      >
        <Ionicons name="add-circle-outline" size={16} color="#fff" className="mr-1" />
        <Text className="text-white font-bold text-xs">+ Novo Serviço</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/completed-services')}
        className="bg-emerald-700 px-3 py-3 rounded-xl shadow-sm mr-1.5 flex-row justify-center items-center"
      >
        <Text className="text-xs mr-1">✅</Text>
        <Text className="text-white font-bold text-xs">Concluídos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/suppliers')}
        className="bg-white border border-brand-burgundy px-3 py-3 rounded-xl shadow-sm flex-row justify-center items-center"
      >
        <Text className="text-xs mr-1">🏬</Text>
        <Text className="text-brand-burgundy font-bold text-xs">Fornecedores</Text>
      </TouchableOpacity>
    </View>
  );
};
