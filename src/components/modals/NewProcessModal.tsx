import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { processRepository } from '../../repositories/processRepository';
import { SewingProcessModel } from '../../models/types';

interface NewProcessModalProps {
  visible: boolean;
  onClose: () => void;
  onProcessCreated: (process: SewingProcessModel) => void;
}

export const NewProcessModal: React.FC<NewProcessModalProps> = ({
  visible,
  onClose,
  onProcessCreated,
}) => {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do processo de costura.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await processRepository.createProcess(name.trim());
      setName('');
      onProcessCreated(created);
      onClose();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao criar novo processo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-center p-5">
        <View className="bg-white rounded-2xl p-6 shadow-lg">
          <Text className="text-xl font-bold text-brand-plum mb-1">
            Novo Processo de Costura 🧵
          </Text>
          <Text className="text-xs text-gray-500 mb-4">
            Cadastre uma nova operação/etapa de costura no catálogo global.
          </Text>

          <Text className="text-sm font-semibold text-gray-700 mb-1">Nome do Processo</Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-3 text-base text-gray-800 bg-white mb-5"
            placeholder="Ex: Pesponto Gola, Costura Lateral"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <View className="flex-row justify-end">
            <TouchableOpacity onPress={onClose} className="px-4 py-3 mr-2">
              <Text className="text-gray-500 font-bold">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={submitting}
              className="bg-brand-burgundy px-5 py-3 rounded-xl"
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">Salvar Processo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
