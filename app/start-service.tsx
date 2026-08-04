import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProcessInputModal } from '../src/components/modals/ProcessInputModal';
import { useAuth } from '../src/context/AuthContext';
import {
  getEffectiveQuantity,
  getServiceOverallProgressPercentage,
  getServiceTotalCompletedProcesses,
  getServiceTotalDefects,
  getServiceTotalPieces,
  getServiceTotalProcesses,
  getVariationProgressPercentage,
  getVariationTotalProcesses,
  ServiceLogModel,
  ServiceModel,
  ServiceVariationModel,
} from '../src/models/types';
import { serviceRepository } from '../src/repositories/serviceRepository';
import { formatCurrency } from '../src/utils/currencyFormatter';
import { getGarmentEmoji } from '../src/utils/garmentIconHelper';

export default function StartServiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser } = useAuth();

  const [service, setService] = useState<ServiceModel | null>(null);
  const [logs, setLogs] = useState<ServiceLogModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'production' | 'history'>('production');

  // Process Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<ServiceVariationModel | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadServiceData();
  }, [id]);

  const loadServiceData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const allServices = await serviceRepository.getAllServices();
      const s = allServices.find((item) => item.id === id);
      if (s) {
        setService(s);
        const l = await serviceRepository.getServiceLogs(id);
        setLogs(l);
      } else {
        Alert.alert('Erro', 'Lote de serviço não encontrado.');
        router.back();
      }
    } catch (e) {
      Alert.alert('Erro', 'Erro ao carregar lote.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProcesses = async (
    variation: ServiceVariationModel,
    count: number,
    breakdownText?: string
  ) => {
    if (!service || !id || !variation.id) return;
    if (count <= 0) return;

    setSubmitting(true);
    try {
      const seamstressName = currentUser?.name || 'Costureira';
      const baseDesc = `${variation.color} (${variation.size})`;
      const variationDesc = breakdownText ? `${baseDesc} - [${breakdownText}]` : baseDesc;

      await serviceRepository.addCompletedProcesses({
        serviceId: id,
        variationId: variation.id,
        seamstressName,
        addedProcesses: count,
        variationDescription: variationDesc,
      });

      if (service.status.toLowerCase() === 'pendente') {
        await serviceRepository.updateServiceStatus(id, 'Em Andamento');
      }

      await loadServiceData();
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao registrar processos.');
    } finally {
      setSubmitting(false);
      setModalVisible(false);
    }
  };

  const handleAddDefect = async (variation: ServiceVariationModel) => {
    if (!variation.id) return;
    Alert.alert('Registrar Defeito', `Confirmar 1 peça com defeito em ${variation.color} (${variation.size})?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar Defeito',
        style: 'destructive',
        onPress: async () => {
          try {
            await serviceRepository.addVariationDefect({ variationId: variation.id!, addedDefects: 1 });
            await loadServiceData();
          } catch (e) {
            Alert.alert('Erro', 'Erro ao registrar defeito.');
          }
        },
      },
    ]);
  };

  if (loading || !service) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#6B224F" />
      </View>
    );
  }

  const totalPieces = getServiceTotalPieces(service);
  const totalProcesses = getServiceTotalProcesses(service);
  const completedProcesses = getServiceTotalCompletedProcesses(service);
  const totalDefects = getServiceTotalDefects(service);
  const overallProgress = getServiceOverallProgressPercentage(service);
  const totalEarnings = totalPieces * service.pricePerPiece;

  return (
    <View className="flex-1 bg-gray-100">
      {/* Tab Bar */}
      <View className="flex-row bg-white elevation-2">
        <TouchableOpacity
          onPress={() => setActiveTab('production')}
          className={`flex-1 py-3.5 items-center border-b-3 ${
            activeTab === 'production' ? 'border-brand-burgundy' : 'border-transparent'
          }`}
        >
          <Text className={`text-sm font-bold ${activeTab === 'production' ? 'text-brand-burgundy' : 'text-gray-500'}`}>
            ✂️ Apontamentos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          className={`flex-1 py-3.5 items-center border-b-3 ${
            activeTab === 'history' ? 'border-brand-burgundy' : 'border-transparent'
          }`}
        >
          <Text className={`text-sm font-bold ${activeTab === 'history' ? 'text-brand-burgundy' : 'text-gray-500'}`}>
            📜 Histórico ({logs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'production' ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Summary Card */}
          <View className="bg-brand-plum rounded-2xl p-5 mb-4 shadow-md">
            <View className="flex-row items-center mb-3">
              <Text className="text-3xl mr-3">{getGarmentEmoji(service.pieceName)}</Text>
              <View className="flex-1">
                <Text className="text-white text-xl font-bold">{service.pieceName}</Text>
                <Text className="text-white/70 text-xs mt-0.5">🏢 {service.supplierName}</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View className="mb-4">
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-white/80 text-xs font-semibold">
                  Progresso Geral ({completedProcesses}/{totalProcesses} proc.)
                </Text>
                <Text className="text-brand-accent font-bold text-sm">{overallProgress.toFixed(1)}%</Text>
              </View>
              <View className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <View style={{ width: `${overallProgress}%` }} className="h-full bg-brand-accent" />
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View className="flex-row justify-between pt-3 border-t border-white/15">
              <View className="items-center">
                <Text className="text-white/70 text-xs">Total Peças</Text>
                <Text className="text-white text-base font-bold mt-0.5">{totalPieces}</Text>
              </View>
              <View className="items-center">
                <Text className="text-white/70 text-xs">Defeitos</Text>
                <Text className="text-red-400 text-base font-bold mt-0.5">{totalDefects}</Text>
              </View>
              <View className="items-center">
                <Text className="text-white/70 text-xs">Valor Previsto</Text>
                <Text className="text-green-400 text-base font-bold mt-0.5">{formatCurrency(totalEarnings)}</Text>
              </View>
            </View>
          </View>

          {/* Variations List */}
          <Text className="text-brand-plum font-bold text-base mb-3">Cores e Tamanhos para Produção</Text>

          {service.variations.map((v, index) => {
            const varTotalProc = getVariationTotalProcesses(v, service.processesPerPiece);
            const varProgress = getVariationProgressPercentage(v, service.processesPerPiece);
            const effectiveQtd = getEffectiveQuantity(v);

            return (
              <View key={v.id || index} className="bg-white rounded-2xl p-4 mb-3.5 shadow-sm border-l-5 border-brand-burgundy">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-brand-plum text-base font-bold">
                    🎨 {v.color} - Tam: {v.size}
                  </Text>
                  <Text className="text-gray-600 text-xs font-semibold">Qtd: {effectiveQtd} peças</Text>
                </View>

                {/* Progress bar per variation */}
                <View className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-gray-600 text-xs">
                      {v.completedProcesses} / {varTotalProc} proc. concluídos
                    </Text>
                    <Text className="text-brand-burgundy font-bold text-xs">{varProgress.toFixed(0)}%</Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View style={{ width: `${varProgress}%` }} className="h-full bg-brand-burgundy" />
                  </View>
                </View>

                {/* Action Buttons (Apontar Processos, Defeito) */}
                <View className="flex-row justify-between items-center">
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedVariation(v);
                      setModalVisible(true);
                    }}
                    disabled={submitting}
                    className="flex-1 bg-brand-burgundy py-2.5 rounded-xl flex-row justify-center items-center mr-2"
                  >
                    <Text className="text-white font-bold text-xs">🧵 Apontar Processos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleAddDefect(v)}
                    className="border border-red-500 px-3 py-2.5 rounded-xl flex-row items-center"
                  >
                    <Text className="text-red-500 font-bold text-xs">⚠️ Defeito</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        /* History Log Tab */
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id || item.createdAt.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="bg-white rounded-xl p-3.5 mb-2.5 shadow-sm border-l-4 border-amber-500">
              <View className="flex-row justify-between mb-1">
                <Text className="text-brand-plum font-bold text-sm">🧵 {item.seamstressName}</Text>
                <Text className="text-gray-400 text-xs">
                  {new Date(item.createdAt).toLocaleDateString('pt-BR')}{' '}
                  {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text className="text-gray-700 text-xs">
                Apontou <Text className="font-bold text-brand-burgundy">+{item.processesCount}</Text> processos na variação
                ({item.variationDescription})
              </Text>
            </View>
          )}
        />
      )}

      {/* Modal Custom Process Input */}
      <ProcessInputModal
        visible={modalVisible}
        service={service}
        variation={selectedVariation}
        isSaving={submitting}
        onClose={() => setModalVisible(false)}
        onSubmit={(totalCount, breakdownText) => {
          if (selectedVariation) {
            handleAddProcesses(selectedVariation, totalCount, breakdownText);
          }
        }}
      />
    </View>
  );
}
