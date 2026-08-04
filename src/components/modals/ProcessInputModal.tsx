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

  // Sub-modal state for setting quantity manually
  const [activeProcessForManualInput, setActiveProcessForManualInput] = useState<string | null>(null);
  const [manualInputValue, setManualInputValue] = useState('0');

  useEffect(() => {
    if (visible && service) {
      const procs =
        service.selectedProcesses && service.selectedProcesses.length > 0
          ? service.selectedProcesses
          : ['Processo Geral'];

      const initial: Record<string, number> = {};
      procs.forEach((p) => {
        initial[p] = 0; // Cada processo inicia obrigatoriamente em 0
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

  const addProcessCount = (procName: string, amount: number) => {
    setCounts((prev) => ({
      ...prev,
      [procName]: Math.max(0, (prev[procName] || 0) + amount),
    }));
  };

  const openManualInput = (procName: string) => {
    setActiveProcessForManualInput(procName);
    setManualInputValue(counts[procName]?.toString() || '0');
  };

  const confirmManualInput = () => {
    if (activeProcessForManualInput) {
      const parsed = parseInt(manualInputValue.trim(), 10);
      updateProcessCount(activeProcessForManualInput, isNaN(parsed) ? 0 : parsed);
    }
    setActiveProcessForManualInput(null);
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
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-white rounded-2xl p-5 shadow-lg max-h-[88%]">
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
              Selecione a quantidade para cada processo (todos iniciam em 0):
            </Text>

            {/* List of sewing processes cards */}
            <ScrollView className="max-h-72 mb-3">
              {Object.keys(counts).map((procName) => {
                const currentVal = counts[procName] || 0;
                return (
                  <View
                    key={procName}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3"
                  >
                    {/* Process Title & Badge */}
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-brand-plum font-bold text-sm">🧵 {procName}</Text>
                      <View className="bg-brand-burgundy/10 px-2.5 py-1 rounded-full border border-brand-burgundy/20">
                        <Text className="text-brand-burgundy font-bold text-xs">
                          {currentVal} un.
                        </Text>
                      </View>
                    </View>

                    {/* Quick Add Buttons: +1, +5, +10, +30, +50 */}
                    <View className="flex-row flex-wrap mb-2">
                      {[1, 5, 10, 30, 50].map((val) => (
                        <TouchableOpacity
                          key={val}
                          onPress={() => addProcessCount(procName, val)}
                          className="bg-brand-burgundy px-2.5 py-1.5 rounded-lg mr-1.5 mb-1.5 flex-row items-center"
                        >
                          <Text className="text-white font-bold text-xs">+{val}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Action buttons: Manual Input & Reset */}
                    <View className="flex-row items-center justify-between pt-1 border-t border-gray-200">
                      <TouchableOpacity
                        onPress={() => openManualInput(procName)}
                        className="bg-brand-plum/10 border border-brand-plum/30 px-3 py-1.5 rounded-lg flex-row items-center"
                      >
                        <Ionicons name="create-outline" size={14} color="#3B1B47" className="mr-1" />
                        <Text className="text-brand-plum font-bold text-xs">Digitar Valor Manualmente</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => updateProcessCount(procName, 0)}
                        className="px-2.5 py-1.5"
                      >
                        <Text className="text-gray-400 font-bold text-xs">Zerar (0)</Text>
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

      {/* Sub-modal for entering quantity manually */}
      <Modal visible={activeProcessForManualInput !== null} animationType="fade" transparent>
        <View className="flex-1 bg-black/60 justify-center p-5">
          <View className="bg-white rounded-2xl p-6 shadow-xl">
            <Text className="text-brand-plum font-bold text-base mb-1">
              ✏️ Inserir Quantidade Manualmente
            </Text>
            <Text className="text-gray-500 text-xs mb-4">
              Processo: <Text className="font-bold text-brand-burgundy">{activeProcessForManualInput}</Text>
            </Text>

            {/* Preset quick values in submodal */}
            <Text className="text-gray-700 font-bold text-xs mb-2">Opções rápidas:</Text>
            <View className="flex-row flex-wrap mb-4">
              {[5, 10, 30, 50, 100].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setManualInputValue(val.toString())}
                  className="bg-brand-burgundy/10 border border-brand-burgundy/30 px-3 py-1.5 rounded-lg mr-2 mb-2"
                >
                  <Text className="text-brand-burgundy font-bold text-xs">{val} un.</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-gray-700 font-bold text-xs mb-1">Ou digite o valor desejado:</Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-3 text-center text-xl font-bold mb-5 bg-gray-50 text-gray-800"
              keyboardType="numeric"
              value={manualInputValue}
              onChangeText={setManualInputValue}
              autoFocus
            />

            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setActiveProcessForManualInput(null)}
                className="px-4 py-2.5 mr-2"
              >
                <Text className="text-gray-500 font-bold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmManualInput}
                className="bg-brand-burgundy px-5 py-2.5 rounded-xl"
              >
                <Text className="text-white font-bold">Definir Qtd</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
