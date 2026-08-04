import React from 'react';
import { ActivityIndicator, FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { ServiceLogModel, ServiceModel } from '../../models/types';

interface HistoryLogModalProps {
  visible: boolean;
  service: ServiceModel | null;
  logs: ServiceLogModel[];
  loading: boolean;
  onClose: () => void;
}

export const HistoryLogModal: React.FC<HistoryLogModalProps> = ({
  visible,
  service,
  logs,
  loading,
  onClose,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/50 justify-center p-5">
        <View className="bg-white rounded-2xl p-6 shadow-lg max-h-[80%]">
          <View className="flex-row items-center mb-3">
            <Text className="text-xl mr-2">📜</Text>
            <View className="flex-1">
              <Text className="text-brand-plum font-bold text-base">Histórico de Atividades</Text>
              <Text className="text-gray-500 text-xs">
                Peça: {service?.pieceName} ({service?.supplierName})
              </Text>
            </View>
          </View>

          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#6B224F" />
            </View>
          ) : logs.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-3xl mb-2">📜</Text>
              <Text className="text-gray-500 text-xs font-bold text-center">
                Nenhum processo lançado ainda neste serviço.
              </Text>
            </View>
          ) : (
            <FlatList
              data={logs}
              keyExtractor={(item) => item.id || item.createdAt.toString()}
              renderItem={({ item }) => (
                <View className="bg-brand-burgundy/5 border border-brand-burgundy/20 rounded-xl p-3 mb-2 flex-row items-start">
                  <Text className="text-base mr-2">🕒</Text>
                  <View className="flex-1">
                    <Text className="text-brand-plum text-xs font-semibold">
                      <Text className="font-bold">{item.seamstressName}</Text> apontou{' '}
                      <Text className="font-bold text-brand-burgundy">+{item.processesCount}</Text> processos na
                      variação ({item.variationDescription}) em{' '}
                      {new Date(item.createdAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}

          <View className="flex-row justify-end mt-4">
            <TouchableOpacity onPress={onClose} className="bg-gray-200 px-5 py-2.5 rounded-xl">
              <Text className="text-gray-700 font-bold">Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
