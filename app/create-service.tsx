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
import { NewProcessModal } from '../src/components/modals/NewProcessModal';
import { SewingProcessModel, ServiceVariationModel, SupplierModel } from '../src/models/types';
import { processRepository } from '../src/repositories/processRepository';
import { serviceRepository } from '../src/repositories/serviceRepository';
import { supplierRepository } from '../src/repositories/supplierRepository';
import { parseCurrencyInput } from '../src/utils/currencyFormatter';

export default function CreateServiceScreen() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<SupplierModel[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState('');

  const [pieceName, setPieceName] = useState('');
  const [allProcesses, setAllProcesses] = useState<SewingProcessModel[]>([]);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [newProcessModalVisible, setNewProcessModalVisible] = useState(false);

  const [priceFormattedText, setPriceFormattedText] = useState('R$ 0,00');
  const [priceRawValue, setPriceRawValue] = useState(0.0);

  // Variations list
  const [variations, setVariations] = useState<ServiceVariationModel[]>([
    { color: 'Preto', size: 'M', quantity: 10, completedProcesses: 0, defects: 0 },
  ]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const supps = await supplierRepository.getAllSuppliers();
      setSuppliers(supps);

      const procs = await processRepository.getAllProcesses();
      setAllProcesses(procs);
    } catch (e) {
      console.warn('Erro ao carregar dados iniciais');
    }
  };

  const toggleProcessSelection = (procName: string) => {
    setSelectedProcesses((prev) =>
      prev.includes(procName) ? prev.filter((p) => p !== procName) : [...prev, procName]
    );
  };

  const handleProcessCreated = (newProc: SewingProcessModel) => {
    setAllProcesses((prev) => [...prev, newProc]);
    setSelectedProcesses((prev) => [...prev, newProc.name]);
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
    if (selectedProcesses.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos 1 processo de costura para a peça.');
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
        processesPerPiece: selectedProcesses.length,
        selectedProcesses,
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

        {/* Details: Piece Name, Sewing Processes, Price */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-base font-bold text-brand-plum mb-3">
            👕 Detalhes da Peça
          </Text>

          <Text className="text-sm font-semibold text-gray-700 mb-1">Nome da Peça</Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-3 text-base text-gray-800 mb-4 bg-white"
            placeholder="Ex: Camisa Polo, Calça Jeans"
            value={pieceName}
            onChangeText={setPieceName}
          />

          {/* Sewing Processes Selection Section */}
          <View className="mb-4 bg-brand-burgundy/5 p-3.5 rounded-xl border border-brand-burgundy/20">
            <View className="flex-row justify-between items-center mb-2.5">
              <View>
                <Text className="text-brand-plum font-bold text-sm">🧵 Processos de Costura</Text>
                <Text className="text-brand-burgundy font-bold text-xs">
                  Calculado: {selectedProcesses.length} processos por peça
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setNewProcessModalVisible(true)}
                className="bg-brand-burgundy px-3 py-1.5 rounded-lg flex-row items-center"
              >
                <Ionicons name="add" size={16} color="#fff" className="mr-0.5" />
                <Text className="text-white font-bold text-xs">Novo Processo</Text>
              </TouchableOpacity>
            </View>

            {allProcesses.length === 0 ? (
              <ActivityIndicator color="#6B224F" />
            ) : (
              <View className="flex-row flex-wrap">
                {allProcesses.map((proc) => {
                  const isChecked = selectedProcesses.includes(proc.name);
                  return (
                    <TouchableOpacity
                      key={proc.id || proc.name}
                      onPress={() => toggleProcessSelection(proc.name)}
                      className={`px-3 py-2 rounded-xl mr-2 mb-2 flex-row items-center border ${
                        isChecked
                          ? 'bg-brand-burgundy border-brand-burgundy'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={16}
                        color={isChecked ? '#fff' : '#666'}
                        className="mr-1.5"
                      />
                      <Text className={`text-xs font-bold ${isChecked ? 'text-white' : 'text-gray-800'}`}>
                        {proc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <Text className="text-sm font-semibold text-gray-700 mb-1">Preço / Peça</Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-3 text-base text-gray-800 bg-white"
            placeholder="R$ 0,00"
            keyboardType="numeric"
            value={priceFormattedText}
            onChangeText={handlePriceChange}
          />
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

      <NewProcessModal
        visible={newProcessModalVisible}
        onClose={() => setNewProcessModalVisible(false)}
        onProcessCreated={handleProcessCreated}
      />
    </KeyboardAvoidingView>
  );
}
