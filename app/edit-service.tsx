import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ServiceVariationModel } from '../src/models/types';
import { serviceRepository } from '../src/repositories/serviceRepository';
import { supplierRepository } from '../src/repositories/supplierRepository';
import { formatCurrency, parseCurrencyInput } from '../src/utils/currencyFormatter';

export default function EditServiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState('');

  const [pieceName, setPieceName] = useState('');
  const [processesPerPieceText, setProcessesPerPieceText] = useState('1');
  const [priceFormattedText, setPriceFormattedText] = useState('R$ 0,00');
  const [priceRawValue, setPriceRawValue] = useState(0.0);
  const [status, setStatus] = useState('Pendente');

  const [variations, setVariations] = useState<ServiceVariationModel[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const allServices = await serviceRepository.getAllServices();
      const service = allServices.find((s) => s.id === id);

      if (service) {
        setSelectedSupplierId(service.supplierId || null);
        setSupplierName(service.supplierName);
        setPieceName(service.pieceName);
        setProcessesPerPieceText(service.processesPerPiece.toString());
        setPriceRawValue(service.pricePerPiece);
        setPriceFormattedText(formatCurrency(service.pricePerPiece));
        setStatus(service.status);
        setVariations(service.variations || []);
      } else {
        Alert.alert('Erro', 'Serviço não encontrado.');
        router.back();
      }
    } catch (e) {
      Alert.alert('Erro', 'Erro ao carregar dados do lote.');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (text: string) => {
    const { rawValue, formattedText } = parseCurrencyInput(text);
    setPriceRawValue(rawValue);
    setPriceFormattedText(formattedText);
  };

  const addVariation = () => {
    setVariations((prev) => [
      ...prev,
      { color: '', size: 'M', quantity: 10, completedProcesses: 0, defects: 0 },
    ]);
  };

  const removeVariation = (index: number) => {
    if (variations.length === 1) {
      Alert.alert('Aviso', 'O lote deve ter pelo menos uma variação.');
      return;
    }
    setVariations((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariation = (index: number, key: keyof ServiceVariationModel, val: any) => {
    setVariations((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: val };
      return next;
    });
  };

  const handleUpdateService = async () => {
    if (!id) return;
    if (!supplierName.trim()) {
      Alert.alert('Atenção', 'Informe o fornecedor.');
      return;
    }
    if (!pieceName.trim()) {
      Alert.alert('Atenção', 'Informe o nome da peça.');
      return;
    }

    const procPerPiece = parseInt(processesPerPieceText, 10);
    if (isNaN(procPerPiece) || procPerPiece < 1) {
      Alert.alert('Atenção', 'O número de processos por peça deve ser no mínimo 1.');
      return;
    }

    setSubmitting(true);
    try {
      await serviceRepository.updateService({
        id,
        supplierId: selectedSupplierId,
        supplierName: supplierName.trim(),
        pieceName: pieceName.trim(),
        processesPerPiece: procPerPiece,
        pricePerPiece: priceRawValue,
        status,
        variations,
      });

      Alert.alert('Sucesso', 'Lote de serviço atualizado!', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar lote.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#2C1435]">
        <ActivityIndicator size="large" color="#6B224F" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-gray-100">
      <ScrollView className="p-4">
        {/* Status Selector */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-base font-bold text-brand-plum mb-3">
            📌 Status do Lote
          </Text>
          <View className="flex-row justify-around">
            {['Pendente', 'Em Andamento', 'Concluído'].map((st) => (
              <TouchableOpacity
                key={st}
                onPress={() => setStatus(st)}
                className={`px-3.5 py-2 rounded-full ${
                  status === st ? 'bg-brand-burgundy' : 'bg-gray-200'
                }`}
              >
                <Text className={`font-bold text-xs ${status === st ? 'text-white' : 'text-gray-800'}`}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Supplier */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-base font-bold text-brand-plum mb-3">
            🏢 Fornecedor
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-3 text-base text-gray-800 bg-white"
            placeholder="Nome do Fornecedor"
            value={supplierName}
            onChangeText={(text) => {
              setSupplierName(text);
              setSelectedSupplierId(null);
            }}
          />
        </View>

        {/* Details */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-base font-bold text-brand-plum mb-3">
            👕 Detalhes do Lote
          </Text>
          <Text className="text-sm font-semibold text-gray-700 mb-1">Nome da Peça</Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-3 text-base text-gray-800 mb-3 bg-white"
            value={pieceName}
            onChangeText={setPieceName}
          />

          <View className="flex-row justify-between">
            <View className="flex-1 mr-2">
              <Text className="text-sm font-semibold text-gray-700 mb-1">Processos / Peça</Text>
              <TextInput
                className="border border-gray-300 rounded-xl p-3 text-base text-gray-800 bg-white"
                keyboardType="numeric"
                value={processesPerPieceText}
                onChangeText={setProcessesPerPieceText}
              />
            </View>

            <View className="flex-1 ml-2">
              <Text className="text-sm font-semibold text-gray-700 mb-1">Preço / Peça</Text>
              <TextInput
                className="border border-gray-300 rounded-xl p-3 text-base text-gray-800 bg-white"
                keyboardType="numeric"
                value={priceFormattedText}
                onChangeText={handlePriceChange}
              />
            </View>
          </View>
        </View>

        {/* Variations */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-bold text-brand-plum">
              🎨 Variações (Cores e Tamanhos)
            </Text>
            <TouchableOpacity onPress={addVariation} className="bg-brand-burgundy p-2 rounded-lg">
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {variations.map((v, index) => (
            <View
              key={index}
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-2.5"
            >
              <View className="flex-row items-center mb-2">
                <Text className="flex-1 font-bold text-brand-burgundy text-xs">Variação #{index + 1}</Text>
                <TouchableOpacity onPress={() => removeVariation(index)}>
                  <Ionicons name="trash-outline" size={20} color="#d9534f" />
                </TouchableOpacity>
              </View>

              <View className="flex-row">
                <View className="flex-2 mr-1.5">
                  <Text className="text-xs text-gray-600 mb-0.5">Cor</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-2 bg-white text-xs text-gray-800"
                    value={v.color}
                    onChangeText={(val) => updateVariation(index, 'color', val)}
                  />
                </View>
                <View className="flex-1 mr-1.5">
                  <Text className="text-xs text-gray-600 mb-0.5">Tam.</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-2 bg-white text-xs text-gray-800"
                    value={v.size}
                    onChangeText={(val) => updateVariation(index, 'size', val)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 mb-0.5">Qtd.</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-2 bg-white text-xs text-gray-800"
                    keyboardType="numeric"
                    value={v.quantity.toString()}
                    onChangeText={(val) => updateVariation(index, 'quantity', parseInt(val, 10) || 0)}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Update Button */}
        <TouchableOpacity
          onPress={handleUpdateService}
          disabled={submitting}
          className="bg-brand-burgundy h-13 rounded-2xl justify-center items-center shadow-md mb-10"
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-bold">Atualizar Lote de Serviço</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
