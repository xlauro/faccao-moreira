import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AboutAppModalProps {
  visible: boolean;
  currentVersion: string;
  hasUpdate?: boolean;
  latestVersion?: string;
  onClose: () => void;
  onCheckUpdate: () => void;
}

export const AboutAppModal: React.FC<AboutAppModalProps> = ({
  visible,
  currentVersion,
  hasUpdate = false,
  latestVersion,
  onClose,
  onCheckUpdate,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-center p-5">
        <View className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 max-h-[85%]">
          {/* Header */}
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-brand-plum/10 items-center justify-center mb-3">
              <Text className="text-3xl">🧵</Text>
            </View>
            <Text className="text-brand-plum text-2xl font-black text-center">Welth</Text>
            <Text className="text-gray-500 text-xs font-semibold text-center mt-0.5">
              Sistema de Gestão para Facções de Costura
            </Text>

            {/* Version Badge */}
            <View className="mt-3 flex-row items-center bg-brand-burgundy/10 px-3 py-1 rounded-full border border-brand-burgundy/20">
              <Ionicons name="code-working-outline" size={14} color="#6B224F" style={{ marginRight: 4 }} />
              <Text className="text-brand-burgundy font-extrabold text-xs">
                Versão {currentVersion} (Build 1)
              </Text>
            </View>
          </View>

          {/* About Details Scrollable */}
          <ScrollView className="mb-4">
            {/* Status de Atualização Card */}
            <View
              className={`p-4 rounded-2xl mb-4 border ${
                hasUpdate
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-brand-burgundy/5 border-brand-burgundy/15'
              }`}
            >
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name={hasUpdate ? 'arrow-up-circle' : 'checkmark-circle'}
                  size={18}
                  color={hasUpdate ? '#10b981' : '#6B224F'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={`font-bold text-xs ${
                    hasUpdate ? 'text-emerald-700' : 'text-brand-plum'
                  }`}
                >
                  {hasUpdate
                    ? `Nova versão v${latestVersion} disponível!`
                    : 'Você está utilizando a versão mais recente!'}
                </Text>
              </View>
              <Text className="text-gray-600 text-[11px] leading-relaxed">
                {hasUpdate
                  ? 'Existe uma nova atualização disponível com melhorias e correções.'
                  : 'Seu aplicativo está atualizado e sincronizado com o servidor.'}
              </Text>
            </View>

            {/* Informations Grid */}
            <View className="gap-3">
              <View className="flex-row items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                <View className="w-8 h-8 rounded-lg bg-brand-burgundy/10 items-center justify-center mr-3">
                  <Ionicons name="business-outline" size={18} color="#6B224F" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">Cliente / Ateliê</Text>
                  <Text className="text-gray-800 text-xs font-bold">Facção Moreira 🧵</Text>
                </View>
              </View>

              <View className="flex-row items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                <View className="w-8 h-8 rounded-lg bg-sky-500/10 items-center justify-center mr-3">
                  <Ionicons name="server-outline" size={18} color="#0284c7" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">Servidor de Produção</Text>
                  <Text className="text-gray-800 text-xs font-bold">OCI Cloud (São Paulo - sa-saopaulo-1)</Text>
                </View>
              </View>

              <View className="flex-row items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                <View className="w-8 h-8 rounded-lg bg-purple-500/10 items-center justify-center mr-3">
                  <Ionicons name="layers-outline" size={18} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">Tecnologias</Text>
                  <Text className="text-gray-800 text-xs font-bold">
                    React Native 0.81.5 • Expo SDK 54 • Neon PostgreSQL
                  </Text>
                </View>
              </View>
            </View>

            {/* Copyright */}
            <View className="mt-5 items-center">
              <Text className="text-gray-400 text-[10px] text-center font-medium">
                © 2026 Welth • Todos os direitos reservados
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="gap-2 pt-2 border-t border-gray-100">
            <TouchableOpacity
              onPress={() => {
                onClose();
                onCheckUpdate();
              }}
              activeOpacity={0.8}
              className="bg-brand-burgundy py-3 rounded-xl flex-row items-center justify-center"
            >
              <Ionicons name="refresh-circle-outline" size={20} color="#ffffff" style={{ marginRight: 6 }} />
              <Text className="text-white font-bold text-xs">Verificar Atualizações Agora</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="py-2.5 items-center justify-center"
            >
              <Text className="text-gray-500 font-bold text-xs">Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
