import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVariationTotalProcesses, ServiceModel, ServiceVariationModel } from '../../models/types';

interface ProcessInputModalProps {
  visible: boolean;
  service: ServiceModel | null;
  variation: ServiceVariationModel | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (totalCount: number, breakdownDescription: string) => void;
}

export const ProcessInputModal: React.FC<ProcessInputModalProps> = ({
  visible,
  service,
  variation,
  isSaving,
  onClose,
  onSubmit,
}) => {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (visible && service) {
      const procs =
        service.selectedProcesses && service.selectedProcesses.length > 0
          ? service.selectedProcesses
          : ['Processo Geral'];

      const initial: Record<string, number> = {};
      procs.forEach((p) => {
        initial[p] = 0; // Cada processo DEVE ser iniciado em 0
      });
      setCounts(initial);
    }
  }, [visible, service]);

  const updateProcessCount = (procName: string, value: number) => {
    const validVal = Math.max(0, isNaN(value) ? 0 : value);
    setCounts((prev) => ({
      ...prev,
      [procName]: validVal,
    }));
  };

  const totalAdded = Object.values(counts).reduce((sum, val) => sum + (val || 0), 0);

  const handleConfirm = () => {
    if (totalAdded <= 0) return;

    const parts = Object.entries(counts)
      .filter(([_, qty]) => qty > 0)
      .map(([name, qty]) => `${name}: ${qty}`);

    const breakdownText = parts.join(', ');
    onSubmit(totalAdded, breakdownText);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-center p-5">
        <View className="bg-white rounded-2xl p-5 shadow-lg max-h-[85%]">
          {/* Header */}
          <View className="flex-row items-center mb-2">
            <Text className="text-xl mr-2">🧵</Text>
            <View className="flex-1">
              <Text className="text-brand-plum font-bold text-base">
                Apontar Produção por Processo
              </Text>
              <Text className="text-gray-500 text-xs">
                Variação: {variation?.color} ({variation?.size}) • Peça: {service?.pieceName}
              </Text>
            </View>
          </View>

          {/* Current progress info */}
          <View className="bg-brand-burgundy/5 border border-brand-burgundy/20 rounded-xl p-3 mb-3">
            <Text className="text-gray-700 text-xs font-semibold">
              Progresso da variação:{' '}
              <Text className="font-bold text-brand-burgundy">
                {variation?.completedProcesses} /{' '}
                {variation && service
                  ? getVariationTotalProcesses(variation, service.processesPerPiece)
                  : 0}{' '}
                processos concluídos
              </Text>
            </Text>
          </View>

          <Text className="text-gray-700 font-bold text-xs mb-2">
            Informe a quantidade concluída em cada processo (iniciado em 0):
          </Text>

          {/* List of sewing processes belonging to the piece */}
          <ScrollView className="max-h-64 mb-3">
            {Object.keys(counts).map((procName) => {
              const currentVal = counts[procName] || 0;
              return (
                <View
                  key={procName}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-2 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-2">
                    <Text className="text-brand-plum font-bold text-sm">🧵 {procName}</Text>
                  </View>

                  <View className="flex-row items-center">
                    {/* Decrement Button */}
                    <TouchableOpacity
                      onPress={() => updateProcessCount(procName, currentVal - 1)}
                      className="bg-gray-200 w-8 h-8 rounded-lg justify-center items-center mr-1"
                    >
                      <Ionicons name="remove" size={18} color="#333" />
                    </TouchableOpacity>

                    {/* Numeric Input */}
                    <TextInput
                      className="border border-gray-300 rounded-lg w-12 h-8 text-center text-sm font-bold bg-white text-gray-800"
                      keyboardType="numeric"
                      value={currentVal.toString()}
                      onChangeText={(txt) => {
                        const parsed = parseInt(txt, 10);
                        updateProcessCount(procName, isNaN(parsed) ? 0 : parsed);
                      }}
                    />

                    {/* Increment Button */}
                    <TouchableOpacity
                      onPress={() => updateProcessCount(procName, currentVal + 1)}
                      className="bg-brand-burgundy w-8 h-8 rounded-lg justify-center items-center ml-1"
                    >
                      <Ionicons name="add" size={18} color="#fff" />
                    </TouchableOpacity>

                    {/* Quick +5 Button */}
                    <TouchableOpacity
                      onPress={() => updateProcessCount(procName, currentVal + 5)}
                      className="bg-brand-plum px-2 h-8 rounded-lg justify-center items-center ml-1.5"
                    >
                      <Text className="text-white font-bold text-xs">+5</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Total Summary Footer */}
          <View className="bg-gray-100 rounded-xl p-3 mb-4 flex-row justify-between items-center border border-gray-200">
            <Text className="text-gray-700 font-bold text-xs">Total a adicionar ao lote:</Text>
            <Text className="text-brand-burgundy font-extrabold text-base">
              +{totalAdded} processo(s)
            </Text>
          </View>

          {/* Modal Actions */}
          <View className="flex-row justify-end">
            <TouchableOpacity onPress={onClose} className="px-4 py-2.5 mr-2">
              <Text className="text-gray-500 font-bold">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={isSaving || totalAdded <= 0}
              className={`px-5 py-2.5 rounded-xl flex-row items-center ${
                totalAdded > 0 ? 'bg-brand-burgundy' : 'bg-gray-300'
              }`}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">Confirmar Apontamento</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
