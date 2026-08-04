import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SupplierModel } from '../src/models/types';
import { supplierRepository } from '../src/repositories/supplierRepository';

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState<SupplierModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await supplierRepository.getAllSuppliers();
      setSuppliers(data);
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao carregar fornecedores.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Atenção', 'Informe o nome e telefone do fornecedor.');
      return;
    }

    setSubmitting(true);
    try {
      await supplierRepository.createSupplier({ name: name.trim(), phone: phone.trim() });
      setName('');
      setPhone('');
      setModalVisible(false);
      await loadSuppliers();
      Alert.alert('Sucesso', 'Fornecedor cadastrado!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao cadastrar fornecedor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="bg-brand-burgundy h-12 rounded-xl flex-row justify-center items-center mb-4 shadow-md"
      >
        <Ionicons name="add" size={24} color="#fff" className="mr-1.5" />
        <Text className="text-white text-base font-bold">Novo Fornecedor</Text>
      </TouchableOpacity>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6B224F" />
        </View>
      ) : suppliers.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="business-outline" size={60} color="#ccc" />
          <Text className="text-base text-gray-500 mt-3">Nenhum fornecedor cadastrado</Text>
        </View>
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={(item) => item.id || item.name}
          renderItem={({ item }) => (
            <View className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center border-l-4 border-brand-burgundy">
              <View className="w-11 h-11 rounded-full bg-brand-burgundy/10 justify-center items-center mr-3.5">
                <Ionicons name="briefcase-outline" size={22} color="#6B224F" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-brand-plum">{item.name}</Text>
                <Text className="text-sm text-gray-600 mt-0.5">📞 {item.phone}</Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal Add Supplier */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center p-5">
          <View className="bg-white rounded-2xl p-6 shadow-lg">
            <Text className="text-xl font-bold text-brand-plum mb-4">
              Cadastrar Fornecedor
            </Text>

            <Text className="text-sm font-semibold text-gray-700 mb-1">Nome do Fornecedor</Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-3 text-base mb-4 bg-white text-gray-800"
              placeholder="Ex: Confecções Silva"
              value={name}
              onChangeText={setName}
            />

            <Text className="text-sm font-semibold text-gray-700 mb-1">Telefone / Celular</Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-3 text-base mb-6 bg-white text-gray-800"
              placeholder="Ex: (11) 98765-4321"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="px-4 py-3 mr-2"
              >
                <Text className="text-gray-500 font-bold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateSupplier}
                disabled={submitting}
                className="bg-brand-burgundy px-5 py-3 rounded-xl"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold">Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
