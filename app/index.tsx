import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
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

export default function HomeScreen() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [services, setServices] = useState<ServiceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Process Dialog State
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [selectedServiceForProcess, setSelectedServiceForProcess] = useState<ServiceModel | null>(null);
  const [selectedVariationForProcess, setSelectedVariationForProcess] = useState<ServiceVariationModel | null>(null);
  const [processInputCount, setProcessInputCount] = useState('1');
  const [isSavingProcess, setIsSavingProcess] = useState(false);

  // Defect Dialog State
  const [defectModalVisible, setDefectModalVisible] = useState(false);
  const [selectedVariationForDefect, setSelectedVariationForDefect] = useState<ServiceVariationModel | null>(null);
  const [defectInputCount, setDefectInputCount] = useState('1');
  const [isSavingDefect, setIsSavingDefect] = useState(false);

  // History Dialog State
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedServiceForHistory, setSelectedServiceForHistory] = useState<ServiceModel | null>(null);
  const [historyLogs, setHistoryLogs] = useState<ServiceLogModel[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const sortServicesByPriority = (list: ServiceModel[]): ServiceModel[] => {
    return [...list].sort((a, b) => {
      const getPriority = (status: string) => {
        const st = (status || '').toLowerCase().trim();
        if (st === 'em andamento' || st === 'ativo') return 1;
        if (st === 'pendente') return 2;
        if (st === 'concluído' || st === 'concluido') return 3;
        return 4;
      };

      const priorityA = getPriority(a.status);
      const priorityB = getPriority(b.status);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  };

  const fetchServices = async () => {
    try {
      const data = await serviceRepository.getAllServices();
      setServices(sortServicesByPriority(data));
    } catch (error) {
      console.error('[HomeScreen] Erro ao buscar serviços:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchServices();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  // Metrics
  const pendingCount = services.filter((s) => s.status.toLowerCase() === 'pendente').length;
  const activeCount = services.filter(
    (s) => s.status.toLowerCase() === 'em andamento' || s.status.toLowerCase() === 'ativo'
  ).length;
  const totalToReceive = services.reduce((sum, s) => sum + s.pricePerPiece * getServiceTotalPieces(s), 0);

  // Actions
  const handleStartServiceDirectly = async (service: ServiceModel) => {
    if (!service.id) return;
    const garmentEmoji = getGarmentEmoji(service.pieceName);

    Alert.alert(
      `${garmentEmoji} Iniciar Serviço?`,
      `Deseja iniciar a produção da peça "${service.pieceName}"?\n\n` +
        `• Fornecedor: ${service.supplierName}\n` +
        `• Total de Peças: ${getServiceTotalPieces(service)} un.\n` +
        `• Total de Processos: ${getServiceTotalProcesses(service)}\n` +
        `• Valor do Lote: ${formatCurrency(getServiceTotalPieces(service) * service.pricePerPiece)}\n\n` +
        `O status mudará de "Pendente 📌" para "Em Andamento ✂️", liberando o lançamento de processos e defeitos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar Serviço 🚀',
          onPress: async () => {
            try {
              await serviceRepository.updateServiceStatus(service.id!, 'Em Andamento');
              await fetchServices();
              Alert.alert('Sucesso', `Serviço "${service.pieceName}" iniciado! ✂️🚀`);
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível iniciar o serviço.');
            }
          },
        },
      ]
    );
  };

  const handleConcludeService = async (service: ServiceModel) => {
    if (!service.id) return;
    const garmentEmoji = getGarmentEmoji(service.pieceName);

    Alert.alert(
      `${garmentEmoji} Concluir Serviço?`,
      `Deseja marcar o serviço "${service.pieceName}" como Concluído ✅?\n\n` +
        `• Fornecedor: ${service.supplierName}\n` +
        `• Progresso do Lote: ${getServiceOverallProgressPercentage(service).toFixed(1)}%\n` +
        `• Total de Peças: ${getServiceTotalPieces(service)} un.\n` +
        `• Valor do Lote: ${formatCurrency(getServiceTotalPieces(service) * service.pricePerPiece)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Concluir Serviço ✅',
          onPress: async () => {
            try {
              await serviceRepository.updateServiceStatus(service.id!, 'Concluído');
              await fetchServices();
              Alert.alert('Sucesso', `Serviço "${service.pieceName}" marcado como Concluído! ✅🎉`);
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível concluir o serviço.');
            }
          },
        },
      ]
    );
  };

  // Open Process Modal
  const openProcessModal = (service: ServiceModel, variation: ServiceVariationModel) => {
    if (service.status.toLowerCase() !== 'em andamento') {
      Alert.alert('Aviso', 'Serviços não iniciados ou concluídos não podem receber processos.');
      return;
    }
    setSelectedServiceForProcess(service);
    setSelectedVariationForProcess(variation);
    setProcessInputCount('1');
    setProcessModalVisible(true);
  };

  const submitAddProcesses = async () => {
    if (!selectedServiceForProcess || !selectedServiceForProcess.id || !selectedVariationForProcess || !selectedVariationForProcess.id) return;
    const count = parseInt(processInputCount.trim(), 10);
    if (isNaN(count) || count <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade maior que 0.');
      return;
    }

    setIsSavingProcess(true);
    try {
      const seamstressName = currentUser?.name || 'Costureira';
      const varDesc = `${selectedVariationForProcess.color} (${selectedVariationForProcess.size})`;

      await serviceRepository.addCompletedProcesses({
        serviceId: selectedServiceForProcess.id,
        variationId: selectedVariationForProcess.id,
        seamstressName,
        addedProcesses: count,
        variationDescription: varDesc,
      });

      setProcessModalVisible(false);
      await fetchServices();
      Alert.alert('Sucesso', `+${count} processos adicionados para ${varDesc}! 🧵✨`);
    } catch (e) {
      Alert.alert('Erro', 'Erro ao adicionar processos.');
    } finally {
      setIsSavingProcess(false);
    }
  };

  // Open Defect Modal
  const openDefectModal = (service: ServiceModel, variation: ServiceVariationModel) => {
    if (service.status.toLowerCase() !== 'em andamento') {
      Alert.alert('Aviso', 'Serviços não iniciados ou concluídos não podem registrar defeitos.');
      return;
    }
    setSelectedVariationForDefect(variation);
    setDefectInputCount('1');
    setDefectModalVisible(true);
  };

  const submitAddDefect = async () => {
    if (!selectedVariationForDefect || !selectedVariationForDefect.id) return;
    const count = parseInt(defectInputCount.trim(), 10);
    if (isNaN(count) || count <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade maior que 0.');
      return;
    }
    if (count > getEffectiveQuantity(selectedVariationForDefect)) {
      Alert.alert('Atenção', `Quantidade maior que as peças disponíveis (${getEffectiveQuantity(selectedVariationForDefect)}).`);
      return;
    }

    setIsSavingDefect(true);
    try {
      await serviceRepository.addVariationDefect({
        variationId: selectedVariationForDefect.id,
        addedDefects: count,
      });

      setDefectModalVisible(false);
      await fetchServices();
      Alert.alert('Sucesso', `${count} peça(s) com defeito registrada(s)! ⚠️`);
    } catch (e) {
      Alert.alert('Erro', 'Erro ao registrar defeito.');
    } finally {
      setIsSavingDefect(false);
    }
  };

  // Open History Modal
  const openHistoryModal = async (service: ServiceModel) => {
    if (!service.id) return;
    setSelectedServiceForHistory(service);
    setHistoryModalVisible(true);
    setLoadingHistory(true);
    try {
      const logs = await serviceRepository.getServiceLogs(service.id);
      setHistoryLogs(logs);
    } catch (e) {
      setHistoryLogs([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar style="light" backgroundColor="#2C1435" />
      {/* Top Header Bar extending behind camera notch / status bar */}
      <View
        className="bg-brand-plum px-4 pb-3 flex-row justify-between items-center shadow"
        style={{ paddingTop: Math.max(insets.top, 12) }}
      >
        <Text className="text-white text-lg font-bold">Facção Moreira 🧵</Text>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={fetchServices} className="p-2 mr-1">
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} className="p-2">
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6B224F']} />}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Welcome Header Card */}
        <View className="bg-brand-burgundy rounded-2xl p-4 shadow-md mb-4 flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-white/20 justify-center items-center mr-3">
            <Text className="text-white text-xl font-bold">
              {currentUser?.name ? currentUser.name.trim()[0].toUpperCase() : 'C'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">
              Olá, {currentUser?.name || 'Costureira'}! 👋
            </Text>
            <Text className="text-white/80 text-xs mt-0.5">Ateliê de Costura Compartilhado</Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View className="flex-row mb-5">
          <TouchableOpacity
            onPress={() => router.push('/start-service')}
            className="flex-1 bg-brand-plum py-3 rounded-xl shadow-sm mr-1.5 flex-row justify-center items-center"
          >
            <Ionicons name="play-circle-outline" size={18} color="#fff" style={{ marginRight: 4 }} />
            <Text className="text-white font-bold text-xs">Iniciar Serviço 🚀</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/create-service')}
            className="flex-1 bg-brand-burgundy py-3 rounded-xl shadow-sm mr-1.5 flex-row justify-center items-center"
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 4 }} />
            <Text className="text-white font-bold text-xs">Novo Serviço</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/suppliers')}
            className="border-[1.5px] border-brand-burgundy px-3 py-3 rounded-xl flex-row justify-center items-center"
          >
            <Text className="text-xs mr-1">🏬</Text>
            <Text className="text-brand-burgundy font-bold text-xs">Fornecedores</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Stats Cards */}
        <Text className="text-brand-plum text-base font-bold mb-2">Visão Geral dos Serviços 📊</Text>
        <View className="flex-row mb-6">
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

        {/* Services List Header */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-brand-plum text-base font-bold">Serviços da Facção 🧵</Text>
          <Text className="text-gray-500 font-bold text-xs">Total: {services.length}</Text>
        </View>

        {loading ? (
          <View className="py-10 items-center">
            <ActivityIndicator size="large" color="#6B224F" />
          </View>
        ) : services.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center shadow-sm">
            <Text className="text-4xl mb-3">📌</Text>
            <Text className="text-brand-plum text-base font-bold">Nenhum serviço cadastrado ainda</Text>
            <Text className="text-gray-500 text-xs text-center mt-1.5">
              {'Clique no botão "Iniciar Serviço" ou "Novo Serviço" acima para gerenciar a produção.'}
            </Text>
          </View>
        ) : (
          services.map((service) => {
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
              <View key={service.id || Math.random().toString()} className="bg-white rounded-2xl p-4 shadow-sm mb-4">
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
                        onPress={() => handleStartServiceDirectly(service)}
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
                            onPress={() => openHistoryModal(service)}
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
                          onPress={() => handleConcludeService(service)}
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

                    {service.variations.map((v, index) => {
                      const varTotalProc = getVariationTotalProcesses(v, service.processesPerPiece);
                      const varPct = getVariationProgressPercentage(v, service.processesPerPiece);
                      const effectiveQtd = getEffectiveQuantity(v);

                      return (
                        <View key={v.id || index} className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 mb-2">
                          <View className="flex-row justify-between items-center mb-1.5">
                            <View className="flex-row items-center flex-1">
                              <Text className="text-brand-plum font-bold text-xs">
                                🎨 {v.color} ({v.size})
                              </Text>
                              <Text className="text-gray-600 text-xs font-semibold ml-1.5">
                                • {effectiveQtd} un.
                              </Text>
                              {v.defects > 0 && (
                                <Text className="text-orange-600 text-xs font-bold ml-1">
                                  (⚠️ -{v.defects})
                                </Text>
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
                              {v.completedProcesses}/{varTotalProc} proc.
                            </Text>
                          </View>

                          {/* Action buttons if active */}
                          {isStarted && (
                            <View className="flex-row mt-1">
                              <TouchableOpacity
                                onPress={() => openProcessModal(service, v)}
                                className="flex-1 bg-brand-burgundy py-1.5 rounded-lg flex-row justify-center items-center mr-1.5"
                              >
                                <Ionicons name="add-circle" size={14} color="#fff" style={{ marginRight: 4 }} />
                                <Text className="text-white font-bold text-xs">+ Processos 🧵</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => openDefectModal(service, v)}
                                className="border border-orange-400 px-2.5 py-1.5 rounded-lg flex-row justify-center items-center"
                              >
                                <Ionicons name="warning-outline" size={14} color="#ea580c" style={{ marginRight: 4 }} />
                                <Text className="text-orange-900 font-bold text-xs">Defeito ⚠️</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* PROCESS INPUT MODAL */}
      <Modal visible={processModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center p-5">
          <View className="bg-white rounded-2xl p-6 shadow-lg">
            <View className="flex-row items-center mb-3">
              <Text className="text-xl mr-2">🧵</Text>
              <Text className="text-brand-plum font-bold text-base flex-1">
                Lançar Processos - {selectedVariationForProcess?.color} ({selectedVariationForProcess?.size})
              </Text>
            </View>

            <Text className="text-brand-plum font-bold text-xs mb-1">
              Peça: {selectedServiceForProcess?.pieceName}
            </Text>
            <Text className="text-gray-500 text-xs mb-4">
              Progresso atual: {selectedVariationForProcess?.completedProcesses} /{' '}
              {selectedVariationForProcess && selectedServiceForProcess
                ? getVariationTotalProcesses(selectedVariationForProcess, selectedServiceForProcess.processesPerPiece)
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
                    const current = parseInt(processInputCount.trim(), 10) || 0;
                    setProcessInputCount((current + val).toString());
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
              value={processInputCount}
              onChangeText={setProcessInputCount}
            />

            <View className="flex-row justify-end">
              <TouchableOpacity onPress={() => setProcessModalVisible(false)} className="px-4 py-2.5 mr-2">
                <Text className="text-gray-500 font-bold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitAddProcesses}
                disabled={isSavingProcess}
                className="bg-brand-burgundy px-5 py-2.5 rounded-xl flex-row items-center"
              >
                {isSavingProcess ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold">Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DEFECT INPUT MODAL */}
      <Modal visible={defectModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center p-5">
          <View className="bg-white rounded-2xl p-6 shadow-lg">
            <View className="flex-row items-center mb-3">
              <Text className="text-xl mr-2">⚠️</Text>
              <Text className="text-brand-plum font-bold text-base flex-1">
                Registrar Defeito - {selectedVariationForDefect?.color} ({selectedVariationForDefect?.size})
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
              value={defectInputCount}
              onChangeText={setDefectInputCount}
            />

            <View className="flex-row justify-end">
              <TouchableOpacity onPress={() => setDefectModalVisible(false)} className="px-4 py-2.5 mr-2">
                <Text className="text-gray-500 font-bold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitAddDefect}
                disabled={isSavingDefect}
                className="bg-red-600 px-5 py-2.5 rounded-xl flex-row items-center"
              >
                {isSavingDefect ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold">Registrar Defeito</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* HISTORY LOGS MODAL */}
      <Modal visible={historyModalVisible} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 justify-center p-5">
          <View className="bg-white rounded-2xl p-6 shadow-lg max-h-[80%]">
            <View className="flex-row items-center mb-3">
              <Text className="text-xl mr-2">📜</Text>
              <View className="flex-1">
                <Text className="text-brand-plum font-bold text-base">Histórico de Atividades</Text>
                <Text className="text-gray-500 text-xs">
                  Peça: {selectedServiceForHistory?.pieceName} ({selectedServiceForHistory?.supplierName})
                </Text>
              </View>
            </View>

            {loadingHistory ? (
              <View className="py-8 items-center">
                <ActivityIndicator color="#6B224F" />
              </View>
            ) : historyLogs.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-3xl mb-2">📜</Text>
                <Text className="text-gray-500 text-xs font-bold text-center">
                  Nenhum processo lançado ainda neste serviço.
                </Text>
              </View>
            ) : (
              <FlatList
                data={historyLogs}
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
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)} className="bg-gray-200 px-5 py-2.5 rounded-xl">
                <Text className="text-gray-700 font-bold">Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
