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
import { useRouter } from 'expo-router';
import { ServiceVariationModel, SupplierModel } from '../src/models/types';
import { serviceRepository } from '../src/repositories/serviceRepository';
import { supplierRepository } from '../src/repositories/supplierRepository';
import { parseCurrencyInput } from '../src/utils/currencyFormatter';

export default function CreateServiceScreen() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<SupplierModel[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState('');

  const [pieceName, setPieceName] = useState('');
  const [processesPerPieceText, setProcessesPerPieceText] = useState('1');
  const [priceFormattedText, setPriceFormattedText] = useState('R$ 0,00');
  const [priceRawValue, setPriceRawValue] = useState(0.0);

  // Variations list
  const [variations, setVariations] = useState<ServiceVariationModel[]>([
    { color: 'Preto', size: 'M', quantity: 10, completedProcesses: 0, defects: 0 },
  ]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await supplierRepository.getAllSuppliers();
      setSuppliers(data);
    } catch (e) {
      console.warn('Erro ao carregar fornecedores');
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

  const handleSaveService = async () => {
    if (!supplierName.trim()) {
      Alert.alert('Atenção', 'Selecione um fornecedor cadastrado na lista.');
      return;
    }
    if (!pieceName.trim()) {
      Alert.alert('Atenção', 'Informe o nome da peça (ex: Camisa Polo).');
      return;
    }

    const procPerPiece = parseInt(processesPerPieceText, 10);
    if (isNaN(procPerPiece) || procPerPiece < 1) {
      Alert.alert('Atenção', 'O número de processos por peça deve ser no mínimo 1.');
      return;
    }

    // Validate variations
    for (let i = 0; i < variations.length; i++) {
      if (!variations[i].color.trim()) {
        Alert.alert('Atenção', `Informe a cor da variação #${i + 1}.`);
        return;
      }
      if (!variations[i].size.trim()) {
        Alert.alert('Atenção', `Informe o tamanho da variação #${i + 1}.`);
        return;
      }
      if (variations[i].quantity < 1) {
        Alert.alert('Atenção', `A quantidade da variação #${i + 1} deve ser no mínimo 1.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await serviceRepository.createService({
        supplierId: selectedSupplierId,
        supplierName: supplierName.trim(),
        pieceName: pieceName.trim(),
        processesPerPiece: procPerPiece,
        pricePerPiece: priceRawValue,
        variations,
      });

      Alert.alert('Sucesso', 'Lote de serviço criado com sucesso!', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-gray-100">
      <ScrollView className="p-4">
        {/* Supplier */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-bold text-brand-plum">🏢 Fornecedor Cadastrado</Text>
            <TouchableOpacity onPress={() => router.push('/suppliers')}>
              <Text className="text-brand-burgundy font-bold text-xs">+ Cadastrar</Text>
            </TouchableOpacity>
          </View>

          {suppliers.length === 0 ? (
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 items-center">
              <Text className="text-amber-900 text-xs font-semibold mb-2 text-center">
                Nenhum fornecedor cadastrado ainda. É necessário cadastrar um fornecedor antes de criar o lote.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/suppliers')}
                className="bg-brand-burgundy px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-bold text-xs">+ Ir para Fornecedores</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row flex-wrap">
              {suppliers.map((sup) => {
                const isSelected = selectedSupplierId === sup.id || supplierName === sup.name;
                return (
                  <TouchableOpacity
                    key={sup.id || sup.name}
                    onPress={() => {
                      setSelectedSupplierId(sup.id || null);
                      setSupplierName(sup.name);
                    }}
                    className={`px-3.5 py-2 rounded-xl mr-2 mb-2 flex-row items-center border ${
                      isSelected ? 'bg-brand-burgundy border-brand-burgundy' : 'bg-gray-100 border-gray-300'
                    }`}
                  >
                    <Text className={`text-xs font-bold mr-1 ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                      {sup.name}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={14} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Details: Piece Name, Processes, Price */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-base font-bold text-brand-plum mb-3">
            👕 Detalhes do Lote
          </Text>

          <Text className="text-sm font-semibold text-gray-700 mb-1">Nome da Peça</Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-3 text-base text-gray-800 mb-3 bg-white"
            placeholder="Ex: Camisa Polo, Calça Jeans"
            value={pieceName}
            onChangeText={setPieceName}
          />

          <View className="flex-row">
            <View className="flex-1 mr-2">
              <Text className="text-sm font-semibold text-gray-700 mb-1">Processos / Peça</Text>
              <TextInput
                className="border border-gray-300 rounded-xl p-3 text-base text-gray-800 bg-white"
                placeholder="1"
                keyboardType="numeric"
                value={processesPerPieceText}
                onChangeText={setProcessesPerPieceText}
              />
            </View>

            <View className="flex-1 ml-2">
              <Text className="text-sm font-semibold text-gray-700 mb-1">Preço / Peça</Text>
              <TextInput
                className="border border-gray-300 rounded-xl p-3 text-base text-gray-800 bg-white"
                placeholder="R$ 0,00"
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
                    placeholder="Ex: Preto"
                    value={v.color}
                    onChangeText={(val) => updateVariation(index, 'color', val)}
                  />
                </View>
                <View className="flex-1 mr-1.5">
                  <Text className="text-xs text-gray-600 mb-0.5">Tam.</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-2 bg-white text-xs text-gray-800"
                    placeholder="M"
                    value={v.size}
                    onChangeText={(val) => updateVariation(index, 'size', val)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 mb-0.5">Qtd.</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-2 bg-white text-xs text-gray-800"
                    placeholder="10"
                    keyboardType="numeric"
                    value={v.quantity.toString()}
                    onChangeText={(val) => updateVariation(index, 'quantity', parseInt(val, 10) || 0)}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSaveService}
          disabled={submitting}
          className="bg-brand-burgundy h-13 rounded-2xl justify-center items-center shadow-md mb-10"
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-bold">Salvar Lote de Serviço</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
