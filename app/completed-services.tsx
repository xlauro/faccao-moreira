import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import {
  formatDurationMs,
  getEffectiveQuantity,
  getServiceDurationText,
  getServiceEffectiveTotalPrice,
  getServiceTotalPieces,
  ServiceModel,
} from '../src/models/types';
import { serviceRepository } from '../src/repositories/serviceRepository';
import { formatCurrency, parseCurrencyInput } from '../src/utils/currencyFormatter';
import { getGarmentEmoji } from '../src/utils/garmentIconHelper';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

type FilterMode = 'month' | 'lifetime';

export default function CompletedServicesScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [allServices, setAllServices] = useState<ServiceModel[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>('month'); // Padrão Mensal

  // Month & Year Picker State
  const currentDateObj = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDateObj.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDateObj.getFullYear());
  const [pickerYear, setPickerYear] = useState<number>(currentDateObj.getFullYear());
  const [monthPickerModalVisible, setMonthPickerModalVisible] = useState(false);

  // Edit Final Price Modal State
  const [editPriceModalVisible, setEditPriceModalVisible] = useState(false);
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState<ServiceModel | null>(null);
  const [editPriceFormattedText, setEditPriceFormattedText] = useState('R$ 0,00');
  const [editPriceRawValue, setEditPriceRawValue] = useState(0.0);
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    loadCompletedServices();
  }, []);

  const loadCompletedServices = async () => {
    setLoading(true);
    try {
      const data = await serviceRepository.getAllServices();
      setAllServices(data);
    } catch (e) {
      Alert.alert('Erro', 'Erro ao carregar serviços.');
    } finally {
      setLoading(false);
    }
  };

  // Filter completed services by status and period (Month & Year or Lifetime)
  const completedServices = allServices.filter((s) => {
    const isDone =
      s.status.toLowerCase() === 'concluído' || s.status.toLowerCase() === 'concluido';
    if (!isDone) return false;

    if (filterMode === 'lifetime') return true;

    // Filter by selected Month and Year
    const serviceDate = s.completedAt ? new Date(s.completedAt) : s.createdAt ? new Date(s.createdAt) : new Date();

    return (
      serviceDate.getMonth() === selectedMonth &&
      serviceDate.getFullYear() === selectedYear
    );
  });

  // Calculate Metrics
  const totalEarnings = completedServices.reduce(
    (sum, s) => sum + getServiceEffectiveTotalPrice(s),
    0
  );
  const totalPieces = completedServices.reduce(
    (sum, s) => sum + getServiceTotalPieces(s),
    0
  );
  const totalVariations = completedServices.reduce(
    (sum, s) => sum + (s.variations ? s.variations.length : 0),
    0
  );

  // Average Duration calculation
  let averageDurationText = '0 min';
  if (completedServices.length > 0) {
    const totalMs = completedServices.reduce((sum, s) => {
      const start = s.createdAt ? new Date(s.createdAt).getTime() : Date.now();
      const end = s.completedAt ? new Date(s.completedAt).getTime() : Date.now();
      return sum + Math.max(0, end - start);
    }, 0);
    const avgMs = totalMs / completedServices.length;
    averageDurationText = formatDurationMs(avgMs);
  }

  const openMonthPicker = () => {
    setPickerYear(selectedYear);
    setMonthPickerModalVisible(true);
  };

  const selectMonthAndYear = (monthIdx: number) => {
    setSelectedMonth(monthIdx);
    setSelectedYear(pickerYear);
    setFilterMode('month');
    setMonthPickerModalVisible(false);
  };

  const openEditPriceModal = (service: ServiceModel) => {
    setSelectedServiceForEdit(service);
    const currentTotal = getServiceEffectiveTotalPrice(service);
    setEditPriceRawValue(currentTotal);
    setEditPriceFormattedText(formatCurrency(currentTotal));
    setEditPriceModalVisible(true);
  };

  const handleSaveFinalPrice = async () => {
    if (!selectedServiceForEdit || !selectedServiceForEdit.id) return;
    if (editPriceRawValue < 0) {
      Alert.alert('Atenção', 'Informe um valor válido.');
      return;
    }

    setSavingPrice(true);
    try {
      await serviceRepository.updateServiceFinalTotalPrice(
        selectedServiceForEdit.id,
        editPriceRawValue
      );
      setEditPriceModalVisible(false);
      await loadCompletedServices();
      Alert.alert('Sucesso', 'Valor final ganho atualizado com sucesso! 💰');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar o valor.');
    } finally {
      setSavingPrice(false);
    }
  };

  const periodTitleText =
    filterMode === 'lifetime'
      ? 'Desde Sempre (Todo o Histórico)'
      : `${MONTH_NAMES[selectedMonth]} de ${selectedYear}`;

  return (
    <View className="flex-1 bg-[#2C1435]">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Header */}
      <View className="flex-row justify-between items-center px-4 pt-12 pb-4 bg-[#3B1B47]">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">Serviços Concluídos ✅</Text>
        <TouchableOpacity onPress={loadCompletedServices} className="p-2">
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Selector Tabs */}
      <View className="flex-row bg-[#3B1B47] px-4 pb-3">
        <TouchableOpacity
          onPress={() => {
            setFilterMode('month');
            openMonthPicker();
          }}
          className={`flex-1 py-2.5 px-2 rounded-xl mr-2 flex-row justify-center items-center ${
            filterMode === 'month' ? 'bg-brand-burgundy' : 'bg-white/10'
          }`}
        >
          <Ionicons name="calendar-outline" size={14} color={filterMode === 'month' ? '#fff' : '#ccc'} className="mr-1" />
          <Text className={`font-bold text-xs ${filterMode === 'month' ? 'text-white' : 'text-gray-300'}`} numberOfLines={1}>
            {MONTH_NAMES[selectedMonth]} {selectedYear} ✏️
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilterMode('lifetime')}
          className={`flex-1 py-2.5 px-2 rounded-xl flex-row justify-center items-center ${
            filterMode === 'lifetime' ? 'bg-brand-burgundy' : 'bg-white/10'
          }`}
        >
          <Text className={`font-bold text-xs ${filterMode === 'lifetime' ? 'text-white' : 'text-gray-300'}`}>
            🌐 Desde Sempre
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B2E67" />
        </View>
      ) : (
        <ScrollView className="flex-1 p-4">
          {/* Summary Cards Grid */}
          <View className="bg-[#3B1B47] rounded-2xl p-4 mb-4 border border-purple-900/40 shadow-lg">
            <View className="flex-row justify-between items-center mb-3 border-b border-white/10 pb-2">
              <Text className="text-gray-300 text-xs font-semibold">
                📊 Resumo do Período:
              </Text>
              <View className="bg-brand-burgundy/20 px-2.5 py-1 rounded-lg border border-brand-burgundy/40">
                <Text className="text-brand-accent font-extrabold text-xs">
                  {periodTitleText}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-white/10">
              <View>
                <Text className="text-gray-400 text-xs">Total Ganho no Período</Text>
                <Text className="text-emerald-400 font-extrabold text-2xl mt-0.5">
                  {formatCurrency(totalEarnings)}
                </Text>
              </View>
              <View className="bg-emerald-500/20 p-3 rounded-2xl">
                <Text className="text-2xl">💰</Text>
              </View>
            </View>

            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-gray-400 text-[11px]">Total Peças</Text>
                <Text className="text-white font-bold text-base mt-0.5">{totalPieces} un</Text>
              </View>

              <View className="items-center flex-1 border-x border-white/10">
                <Text className="text-gray-400 text-[11px]">Variações</Text>
                <Text className="text-white font-bold text-base mt-0.5">{totalVariations}</Text>
              </View>

              <View className="items-center flex-1">
                <Text className="text-gray-400 text-[11px]">Duração Média</Text>
                <Text className="text-sky-300 font-bold text-xs mt-1">{averageDurationText}</Text>
              </View>
            </View>
          </View>

          {/* List Section Header */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white font-bold text-base">
              Lotes Concluídos ({completedServices.length})
            </Text>
          </View>

          {completedServices.length === 0 ? (
            <View className="bg-[#3B1B47] rounded-2xl p-6 items-center border border-purple-900/40 my-6">
              <Text className="text-4xl mb-2">🎉</Text>
              <Text className="text-white font-bold text-base mb-1">Nenhum serviço concluído</Text>
              <Text className="text-gray-400 text-xs text-center">
                Não há serviços marcados como concluídos no período selecionado ({filterMode === 'month' ? 'Este Mês' : 'Desde Sempre'}).
              </Text>
            </View>
          ) : (
            completedServices.map((service) => {
              const garmentEmoji = getGarmentEmoji(service.pieceName);
              const servicePieces = getServiceTotalPieces(service);
              const effectivePrice = getServiceEffectiveTotalPrice(service);
              const durationText = getServiceDurationText(service);
              const isCustomPrice = service.finalTotalPrice !== null && service.finalTotalPrice !== undefined;

              return (
                <View
                  key={service.id}
                  className="bg-white rounded-2xl p-4 mb-4 shadow-sm border-l-6 border-emerald-500"
                >
                  {/* Top Info */}
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center flex-1 mr-2">
                      <Text className="text-2xl mr-2">{garmentEmoji}</Text>
                      <View className="flex-1">
                        <Text className="text-brand-plum text-base font-bold" numberOfLines={1}>
                          {service.pieceName}
                        </Text>
                        <Text className="text-gray-500 text-xs">🏢 {service.supplierName}</Text>
                      </View>
                    </View>

                    <View className="bg-emerald-100 px-2.5 py-1 rounded-xl">
                      <Text className="text-emerald-800 text-xs font-bold">Concluído ✅</Text>
                    </View>
                  </View>

                  {/* Service Duration & Date Badge */}
                  <View className="bg-gray-100 rounded-xl p-2.5 mb-3 flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={16} color="#666" className="mr-1" />
                      <Text className="text-gray-700 text-xs font-semibold">
                        Duração: <Text className="font-bold text-brand-burgundy">{durationText}</Text>
                      </Text>
                    </View>

                    <Text className="text-gray-500 text-[11px]">
                      {service.completedAt
                        ? `Em: ${new Date(service.completedAt).toLocaleDateString('pt-BR')}`
                        : service.createdAt
                        ? `Criado: ${new Date(service.createdAt).toLocaleDateString('pt-BR')}`
                        : ''}
                    </Text>
                  </View>

                  {/* Variations Summary */}
                  <Text className="text-gray-600 text-xs font-bold mb-1.5">
                    Variações Produzidas ({servicePieces} peças):
                  </Text>
                  <View className="flex-row flex-wrap mb-3">
                    {service.variations.map((v, idx) => (
                      <View
                        key={idx}
                        className="bg-brand-burgundy/5 border border-brand-burgundy/15 rounded-lg px-2.5 py-1 mr-1.5 mb-1.5"
                      >
                        <Text className="text-brand-plum text-xs font-semibold">
                          🎨 {v.color} | 📐 {v.size} | 🔢 {getEffectiveQuantity(v)} un
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Final Price Row & Edit Button */}
                  <View className="flex-row justify-between items-center pt-3 border-t border-gray-200">
                    <View>
                      <Text className="text-gray-500 text-xs font-semibold">Valor Ganho no Lote:</Text>
                      <View className="flex-row items-center">
                        <Text className="text-emerald-600 font-extrabold text-lg mr-1.5">
                          {formatCurrency(effectivePrice)}
                        </Text>
                        {isCustomPrice && (
                          <View className="bg-amber-100 px-2 py-0.5 rounded-md">
                            <Text className="text-amber-800 font-bold text-[10px]">Editado ✏️</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => openEditPriceModal(service)}
                      className="bg-brand-burgundy px-3 py-2 rounded-xl flex-row items-center"
                    >
                      <Ionicons name="create-outline" size={16} color="#fff" className="mr-1" />
                      <Text className="text-white text-xs font-bold">Editar Valor ✏️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Edit Final Price Modal */}
      <Modal visible={editPriceModalVisible} animationType="fade" transparent>
        <View className="flex-1 bg-black/60 justify-center p-5">
          <View className="bg-white rounded-2xl p-6 shadow-xl">
            <Text className="text-brand-plum font-bold text-lg mb-1">
              ✏️ Editar Valor Ganho no Lote
            </Text>
            <Text className="text-gray-500 text-xs mb-4">
              Ajuste o valor final ganho na peça &quot;{selectedServiceForEdit?.pieceName}&quot; (ex: acordos com fornecedor ou descontos).
            </Text>

            <Text className="text-gray-700 font-semibold text-xs mb-1">Valor Total Final (R$):</Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-3 text-center text-xl font-bold mb-5 bg-gray-50 text-gray-800"
              keyboardType="numeric"
              value={editPriceFormattedText}
              onChangeText={(text) => {
                const { rawValue, formattedText } = parseCurrencyInput(text);
                setEditPriceRawValue(rawValue);
                setEditPriceFormattedText(formattedText);
              }}
              autoFocus
            />

            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setEditPriceModalVisible(false)}
                className="px-4 py-2.5 mr-2"
              >
                <Text className="text-gray-500 font-bold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveFinalPrice}
                disabled={savingPrice}
                className="bg-brand-burgundy px-5 py-2.5 rounded-xl"
              >
                {savingPrice ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold">Salvar Valor</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Month & Year Calendar Selection Modal */}
      <Modal visible={monthPickerModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-center p-5">
          <View className="bg-white rounded-2xl p-6 shadow-xl">
            <Text className="text-brand-plum font-bold text-lg mb-1">
              📅 Selecionar Mês e Ano
            </Text>
            <Text className="text-gray-500 text-xs mb-4">
              Escolha o ano e o mês para filtrar o resumo e os serviços concluídos.
            </Text>

            {/* Year Controls */}
            <View className="flex-row justify-between items-center bg-gray-100 p-3 rounded-xl mb-4">
              <TouchableOpacity
                onPress={() => setPickerYear((y) => y - 1)}
                className="bg-white p-2 rounded-lg border border-gray-300"
              >
                <Ionicons name="chevron-back" size={20} color="#333" />
              </TouchableOpacity>

              <Text className="text-brand-plum font-extrabold text-lg">
                Ano {pickerYear}
              </Text>

              <TouchableOpacity
                onPress={() => setPickerYear((y) => y + 1)}
                className="bg-white p-2 rounded-lg border border-gray-300"
              >
                <Ionicons name="chevron-forward" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            {/* 12 Months Grid */}
            <Text className="text-gray-700 font-bold text-xs mb-2">Selecione o Mês:</Text>
            <View className="flex-row flex-wrap justify-between mb-5">
              {MONTH_NAMES.map((mName, idx) => {
                const isSelected = idx === selectedMonth && pickerYear === selectedYear;
                return (
                  <TouchableOpacity
                    key={mName}
                    onPress={() => selectMonthAndYear(idx)}
                    className={`w-[30%] py-3 mb-2 rounded-xl items-center border ${
                      isSelected
                        ? 'bg-brand-burgundy border-brand-burgundy'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      {mName.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Actions */}
            <View className="flex-row justify-between items-center">
              <TouchableOpacity
                onPress={() => {
                  const now = new Date();
                  setPickerYear(now.getFullYear());
                  setSelectedYear(now.getFullYear());
                  setSelectedMonth(now.getMonth());
                  setFilterMode('month');
                  setMonthPickerModalVisible(false);
                }}
                className="bg-brand-plum/10 border border-brand-plum/30 px-3 py-2.5 rounded-xl"
              >
                <Text className="text-brand-plum font-bold text-xs">Mês Atual</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMonthPickerModalVisible(false)}
                className="px-4 py-2.5"
              >
                <Text className="text-gray-500 font-bold text-xs">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
