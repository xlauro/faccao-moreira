import React from 'react';
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ServiceVariationModel } from '../../models/types';

interface DefectInputModalProps {
  visible: boolean;
  variation: ServiceVariationModel | null;
  countText: string;
  isSaving: boolean;
  onCountTextChange: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const DefectInputModal: React.FC<DefectInputModalProps> = ({
  visible,
  variation,
  countText,
  isSaving,
  onCountTextChange,
  onClose,
  onSubmit,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-center p-5">
        <View className="bg-white rounded-2xl p-6 shadow-lg">
          <View className="flex-row items-center mb-3">
            <Text className="text-xl mr-2">⚠️</Text>
            <Text className="text-brand-plum font-bold text-base flex-1">
              Registrar Defeito - {variation?.color} ({variation?.size})
            </Text>
          </View>

          <View className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
            <Text className="text-orange-900 text-xs">
              As peças com defeito registradas serão subtraídas do total do lote e dos processos necessários.
            </Text>
          </View>

          <TextInput
            className="border border-gray-300 rounded-xl p-3 text-center text-lg font-bold mb-5"
            keyboardType="numeric"
            value={countText}
            onChangeText={onCountTextChange}
          />

          <View className="flex-row justify-end">
            <TouchableOpacity onPress={onClose} className="px-4 py-2.5 mr-2">
              <Text className="text-gray-500 font-bold">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSubmit}
              disabled={isSaving}
              className="bg-red-600 px-5 py-2.5 rounded-xl flex-row items-center"
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">Registrar Defeito</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
