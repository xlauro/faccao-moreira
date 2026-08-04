import React from 'react';
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getVariationTotalProcesses, ServiceModel, ServiceVariationModel } from '../../models/types';

interface ProcessInputModalProps {
  visible: boolean;
  service: ServiceModel | null;
  variation: ServiceVariationModel | null;
  countText: string;
  isSaving: boolean;
  onCountTextChange: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const ProcessInputModal: React.FC<ProcessInputModalProps> = ({
  visible,
  service,
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
            <Text className="text-xl mr-2">🧵</Text>
            <Text className="text-brand-plum font-bold text-base flex-1">
              Lançar Processos - {variation?.color} ({variation?.size})
            </Text>
          </View>

          <Text className="text-brand-plum font-bold text-xs mb-1">
            Peça: {service?.pieceName}
          </Text>
          <Text className="text-gray-500 text-xs mb-4">
            Progresso atual: {variation?.completedProcesses} /{' '}
            {variation && service
              ? getVariationTotalProcesses(variation, service.processesPerPiece)
              : 0}{' '}
            processos
          </Text>

          {/* Quick Add Chips */}
          <Text className="text-gray-700 font-bold text-xs mb-2">Somar à quantidade:</Text>
          <View className="flex-row flex-wrap mb-4">
            {[1, 5, 10, 30, 50].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => {
                  const current = parseInt(countText.trim(), 10) || 0;
                  onCountTextChange((current + val).toString());
                }}
                className="bg-brand-burgundy/10 px-3 py-1.5 rounded-full mr-2 mb-2"
              >
                <Text className="text-brand-burgundy font-bold text-xs">+{val} proc.</Text>
              </TouchableOpacity>
            ))}
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
              className="bg-brand-burgundy px-5 py-2.5 rounded-xl flex-row items-center"
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
