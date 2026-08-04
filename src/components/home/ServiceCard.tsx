import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  getServiceOverallProgressPercentage,
  getServiceTotalCompletedProcesses,
  getServiceTotalDefects,
  getServiceTotalPieces,
  getServiceTotalProcesses,
  ServiceModel,
  ServiceVariationModel,
} from '../../models/types';
import { formatCurrency } from '../../utils/currencyFormatter';
import { getGarmentEmoji } from '../../utils/garmentIconHelper';
import { VariationItem } from './VariationItem';

interface ServiceCardProps {
  service: ServiceModel;
  onStartServiceDirectly: (service: ServiceModel) => void;
  onConcludeService: (service: ServiceModel) => void;
  onOpenProcessModal: (service: ServiceModel, variation: ServiceVariationModel) => void;
  onOpenDefectModal: (service: ServiceModel, variation: ServiceVariationModel) => void;
  onOpenHistoryModal: (service: ServiceModel) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onStartServiceDirectly,
  onConcludeService,
  onOpenProcessModal,
  onOpenDefectModal,
  onOpenHistoryModal,
}) => {
  const router = useRouter();

  const isPending = service.status.toLowerCase() === 'pendente';
  const isDone = service.status.toLowerCase() === 'concluído';
  const isStarted = service.status.toLowerCase() === 'em andamento' || service.status.toLowerCase() === 'ativo';
  const garmentEmoji = getGarmentEmoji(service.pieceName);
  const totalPieces = getServiceTotalPieces(service);
  const totalPrice = service.pricePerPiece * totalPieces;
  const overallProgress = getServiceOverallProgressPercentage(service);
  const totalProcesses = getServiceTotalProcesses(service);
  const completedProcesses = getServiceTotalCompletedProcesses(service);
  const totalDefects = getServiceTotalDefects(service);

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
      {/* Top Row: Piece Name & Status Chip & Edit Button */}
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          <Text className="text-2xl mr-2">{garmentEmoji}</Text>
          <Text className="text-brand-plum text-lg font-bold flex-1" numberOfLines={1}>
            {service.pieceName}
          </Text>
        </View>

        <View className="flex-row items-center">
          <View
            className={`px-2.5 py-1 rounded-xl flex-row items-center ${
              isPending ? 'bg-orange-100' : isDone ? 'bg-blue-100' : 'bg-green-100'
            }`}
          >
            <Text className="text-xs mr-1">{isPending ? '📌' : isDone ? '✅' : '✂️'}</Text>
            <Text
              className={`text-xs font-bold ${
                isPending ? 'text-orange-800' : isDone ? 'text-blue-800' : 'text-green-800'
              }`}
            >
              {service.status}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push({ pathname: '/edit-service', params: { id: service.id } })}
            className="p-1.5 ml-1"
          >
            <Ionicons name="create-outline" size={20} color="#6B224F" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Supplier & Price Info Row */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Text className="text-xs mr-1">🏬</Text>
          <Text className="text-gray-600 text-xs font-semibold">Fornecedor: </Text>
          <Text className="text-brand-burgundy text-xs font-bold">{service.supplierName}</Text>
        </View>
        <Text className="text-green-800 font-bold text-sm">{formatCurrency(totalPrice)}</Text>
      </View>

      {/* CONDITIONAL BODY BASED ON STATUS */}
      {isPending ? (
        /* Pending Banner */
        <View>
          <View className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex-row items-center mb-3">
            <Text className="text-2xl mr-2.5">📌</Text>
            <View className="flex-1 mr-2">
              <Text className="text-orange-900 font-bold text-xs">Serviço Não Iniciado</Text>
              <Text className="text-gray-500 text-xs">
                Inicie a produção para liberar o lançamento de processos e defeitos.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onStartServiceDirectly(service)}
              className="bg-brand-burgundy px-3 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="play" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text className="text-white text-xs font-bold">Iniciar 🚀</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-gray-500 text-xs font-semibold mb-1.5">Variações Cadastradas 🎨:</Text>
          <View className="flex-row flex-wrap">
            {service.variations.map((v, i) => (
              <View key={i} className="bg-gray-100 border border-gray-300 rounded-lg px-2.5 py-1.5 mr-1.5 mb-1.5">
                <Text className="text-brand-plum text-xs font-semibold">
                  🎨 {v.color} | 📐 {v.size} | 🔢 {v.quantity} un
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        /* Active or Concluded Body */
        <View>
          {/* Master Overall Progress Box */}
          <View className="bg-brand-burgundy/10 border border-brand-burgundy/20 rounded-xl p-3 mb-3">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-brand-plum font-bold text-xs">📊 Progresso Geral do Lote:</Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => onOpenHistoryModal(service)}
                  className="bg-brand-burgundy/10 px-2 py-1 rounded-md mr-2"
                >
                  <Text className="text-brand-burgundy font-bold text-xs">Histórico 📜</Text>
                </TouchableOpacity>
                <Text className="text-brand-burgundy font-bold text-sm">
                  {overallProgress.toFixed(1)}%
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="h-2.5 bg-gray-300 rounded-full overflow-hidden mb-1.5">
              <View
                style={{ width: `${overallProgress}%` }}
                className={`h-full ${overallProgress >= 100 ? 'bg-green-600' : 'bg-brand-burgundy'}`}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-700 font-semibold text-xs">
                ⚙️ {completedProcesses} / {totalProcesses} proc. ({totalPieces} peças)
              </Text>
              {totalDefects > 0 && (
                <Text className="text-orange-600 font-bold text-xs">
                  ⚠️ {totalDefects} defeito(s)
                </Text>
              )}
            </View>

            {isStarted && (
              <TouchableOpacity
                onPress={() => onConcludeService(service)}
                className="border border-blue-400 py-1.5 rounded-lg flex-row justify-center items-center mt-2.5"
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#1e40af" style={{ marginRight: 4 }} />
                <Text className="text-blue-900 font-bold text-xs">Concluir Serviço ✅</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Variations List */}
          <Text className="text-gray-500 text-xs font-semibold mb-2">
            Variações e Acompanhamento de Processos 🎨:
          </Text>

          {service.variations.map((v, index) => (
            <VariationItem
              key={v.id || index}
              variation={v}
              processesPerPiece={service.processesPerPiece}
              isStarted={isStarted}
              onOpenProcessModal={() => onOpenProcessModal(service, v)}
              onOpenDefectModal={() => onOpenDefectModal(service, v)}
            />
          ))}
        </View>
      )}
    </View>
  );
};
