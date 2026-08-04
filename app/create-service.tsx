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
      Alert.alert('Atenção', 'Informe ou selecione o fornecedor.');
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
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao criar lote de serviço.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Supplier */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2C1435', marginBottom: 12 }}>
            🏢 Fornecedor
          </Text>
          {suppliers.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              {suppliers.map((sup) => (
                <TouchableOpacity
                  key={sup.id || sup.name}
                  onPress={() => {
                    setSelectedSupplierId(sup.id || null);
                    setSupplierName(sup.name);
                  }}
                  style={{
                    backgroundColor: supplierName === sup.name ? '#6B224F' : '#f0f0f0',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: supplierName === sup.name ? '#fff' : '#333', fontSize: 13, fontWeight: '600' }}>
                    {sup.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TextInput
            style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 16 }}
            placeholder="Nome do Fornecedor"
            value={supplierName}
            onChangeText={(text) => {
              setSupplierName(text);
              setSelectedSupplierId(null);
            }}
          />
        </View>

        {/* Details: Piece Name, Processes, Price */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2C1435', marginBottom: 12 }}>
            👕 Detalhes do Lote
          </Text>

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 }}>Nome da Peça</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 14 }}
            placeholder="Ex: Camisa Polo, Calça Jeans"
            value={pieceName}
            onChangeText={setPieceName}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 }}>Processos / Peça</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 16 }}
                placeholder="1"
                keyboardType="numeric"
                value={processesPerPieceText}
                onChangeText={setProcessesPerPieceText}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 }}>Preço / Peça</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 16 }}
                placeholder="R$ 0,00"
                keyboardType="numeric"
                value={priceFormattedText}
                onChangeText={handlePriceChange}
              />
            </View>
          </View>
        </View>

        {/* Variations */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, elevation: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2C1435' }}>
              🎨 Variações (Cores e Tamanhos)
            </Text>
            <TouchableOpacity onPress={addVariation} style={{ backgroundColor: '#6B224F', padding: 8, borderRadius: 8 }}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {variations.map((v, index) => (
            <View
              key={index}
              style={{
                backgroundColor: '#f9f9f9',
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#eee',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ flex: 1, fontWeight: 'bold', color: '#6B224F' }}>Variação #{index + 1}</Text>
                <TouchableOpacity onPress={() => removeVariation(index)}>
                  <Ionicons name="trash-outline" size={20} color="#d9534f" />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 2, marginRight: 6 }}>
                  <Text style={{ fontSize: 12, color: '#555' }}>Cor</Text>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, backgroundColor: '#fff' }}
                    placeholder="Ex: Preto"
                    value={v.color}
                    onChangeText={(val) => updateVariation(index, 'color', val)}
                  />
                </View>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={{ fontSize: 12, color: '#555' }}>Tam.</Text>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, backgroundColor: '#fff' }}
                    placeholder="M"
                    value={v.size}
                    onChangeText={(val) => updateVariation(index, 'size', val)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#555' }}>Qtd.</Text>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, backgroundColor: '#fff' }}
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
          style={{
            backgroundColor: '#6B224F',
            height: 52,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 4,
            marginBottom: 40,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold' }}>Salvar Lote de Serviço</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
