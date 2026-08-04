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
import { useRouter } from 'expo-router';
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
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={{ flex: 1, padding: 16 }}>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{
            backgroundColor: '#6B224F',
            height: 48,
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            elevation: 3,
          }}
        >
          <Ionicons name="add" size={24} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Novo Fornecedor</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6B224F" />
          </View>
        ) : suppliers.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="business-outline" size={60} color="#ccc" />
            <Text style={{ fontSize: 16, color: '#888', marginTop: 12 }}>Nenhum fornecedor cadastrado</Text>
          </View>
        ) : (
          <FlatList
            data={suppliers}
            keyExtractor={(item) => item.id || item.name}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  elevation: 2,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderLeftWidth: 4,
                  borderLeftColor: '#6B224F',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: 'rgba(107, 34, 79, 0.1)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="briefcase-outline" size={22} color="#6B224F" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2C1435' }}>{item.name}</Text>
                  <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>📞 {item.phone}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Modal Add Supplier */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 5 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2C1435', marginBottom: 16 }}>
              Cadastrar Fornecedor
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 }}>Nome do Fornecedor</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 10,
                padding: 12,
                fontSize: 16,
                marginBottom: 16,
              }}
              placeholder="Ex: Confecções Silva"
              value={name}
              onChangeText={setName}
            />

            <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 }}>Telefone / Celular</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 10,
                padding: 12,
                fontSize: 16,
                marginBottom: 24,
              }}
              placeholder="Ex: (11) 98765-4321"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ paddingHorizontal: 16, paddingVertical: 12, marginRight: 8 }}
              >
                <Text style={{ color: '#777', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateSupplier}
                disabled={submitting}
                style={{
                  backgroundColor: '#6B224F',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 10,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
