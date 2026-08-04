import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/currencyFormatter';

interface SummaryStatsOverviewProps {
  pendingCount: number;
  activeCount: number;
  totalToReceive: number;
}

export const SummaryStatsOverview: React.FC<SummaryStatsOverviewProps> = ({
  pendingCount,
  activeCount,
  totalToReceive,
}) => {
  return (
    <View className="mb-6">
      <Text className="text-brand-plum text-base font-bold mb-2">Visão Geral dos Serviços 📊</Text>
      <View className="flex-row">
        <View className="flex-1 bg-white p-3 rounded-2xl shadow-sm mr-2 border-l-4 border-orange-500">
          <Ionicons name="time-outline" size={22} color="#c2410c" />
          <Text className="text-orange-700 font-bold text-lg mt-1">{pendingCount}</Text>
          <Text className="text-gray-500 font-semibold text-xs mt-0.5">Pendentes 📌</Text>
        </View>

        <View className="flex-1 bg-white p-3 rounded-2xl shadow-sm mr-2 border-l-4 border-green-600">
          <Ionicons name="cut-outline" size={22} color="#15803d" />
          <Text className="text-green-700 font-bold text-lg mt-1">{activeCount}</Text>
          <Text className="text-gray-500 font-semibold text-xs mt-0.5">Ativos ✂️</Text>
        </View>

        <View className="flex-1 bg-white p-3 rounded-2xl shadow-sm border-l-4 border-blue-600">
          <Ionicons name="cash-outline" size={22} color="#1d4ed8" />
          <Text className="text-blue-700 font-bold text-sm mt-1" numberOfLines={1}>
            {formatCurrency(totalToReceive)}
          </Text>
          <Text className="text-gray-500 font-semibold text-xs mt-0.5">A Receber 💵</Text>
        </View>
      </View>
    </View>
  );
};
