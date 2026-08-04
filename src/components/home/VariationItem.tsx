import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getEffectiveQuantity,
  getVariationProgressPercentage,
  getVariationTotalProcesses,
  ServiceVariationModel,
} from '../../models/types';

interface VariationItemProps {
  variation: ServiceVariationModel;
  processesPerPiece: number;
  isStarted: boolean;
  onOpenProcessModal: () => void;
  onOpenDefectModal: () => void;
}

export const VariationItem: React.FC<VariationItemProps> = ({
  variation,
  processesPerPiece,
  isStarted,
  onOpenProcessModal,
  onOpenDefectModal,
}) => {
  const varTotalProc = getVariationTotalProcesses(variation, processesPerPiece);
  const varPct = getVariationProgressPercentage(variation, processesPerPiece);
  const effectiveQtd = getEffectiveQuantity(variation);

  return (
    <View className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 mb-2">
      <View className="flex-row justify-between items-center mb-1.5">
        <View className="flex-row items-center flex-1">
          <Text className="text-brand-plum font-bold text-xs">
            🎨 {variation.color} ({variation.size})
          </Text>
          <Text className="text-gray-600 text-xs font-semibold ml-1.5">• {effectiveQtd} un.</Text>
          {variation.defects > 0 && (
            <Text className="text-orange-600 text-xs font-bold ml-1">(⚠️ -{variation.defects})</Text>
          )}
        </View>
        <Text
          className={`text-xs font-bold ${
            varPct >= 100 ? 'text-green-800' : 'text-brand-burgundy'
          }`}
        >
          {varPct.toFixed(1)}%
        </Text>
      </View>

      {/* Variation Progress Bar */}
      <View className="flex-row items-center mb-2">
        <View className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
          <View
            style={{ width: `${varPct}%` }}
            className={`h-full ${varPct >= 100 ? 'bg-green-600' : 'bg-brand-burgundy'}`}
          />
        </View>
        <Text className="text-brand-plum text-xs font-bold">
          {variation.completedProcesses}/{varTotalProc} proc.
        </Text>
      </View>

      {/* Action buttons if active */}
      {isStarted && (
        <View className="flex-row mt-1">
          <TouchableOpacity
            onPress={onOpenProcessModal}
            className="flex-1 bg-brand-burgundy py-1.5 rounded-lg flex-row justify-center items-center mr-1.5"
          >
            <Ionicons name="add-circle" size={14} color="#fff" className="mr-1" />
            <Text className="text-white font-bold text-xs">+ Processos 🧵</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenDefectModal}
            className="border border-orange-400 px-2.5 py-1.5 rounded-lg flex-row justify-center items-center"
          >
            <Ionicons name="warning-outline" size={14} color="#ea580c" className="mr-1" />
            <Text className="text-orange-900 font-bold text-xs">Defeito ⚠️</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
