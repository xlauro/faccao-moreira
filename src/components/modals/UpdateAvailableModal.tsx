import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VersionInfo } from '../../services/updateService';

interface UpdateAvailableModalProps {
  visible: boolean;
  currentVersion: string;
  versionInfo: VersionInfo | null;
  onDownload: () => void;
  onClose: () => void;
}

export const UpdateAvailableModal: React.FC<UpdateAvailableModalProps> = ({
  visible,
  currentVersion,
  versionInfo,
  onDownload,
  onClose,
}) => {
  if (!versionInfo) return null;

  const isForceUpdate = Boolean(versionInfo.forceUpdate);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-center p-5">
        <View className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100">
          {/* Header Icon & Title */}
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-brand-burgundy/10 items-center justify-center mb-3">
              <Ionicons name="rocket-outline" size={36} color="#6B224F" />
            </View>
            <Text className="text-brand-plum text-xl font-extrabold text-center">
              Nova Versão Disponível! 🎉
            </Text>
            <Text className="text-gray-500 text-xs text-center mt-1">
              Uma nova atualização do Welth está pronta para download.
            </Text>
          </View>

          {/* Version Comparison Card */}
          <View className="bg-brand-burgundy/5 border border-brand-burgundy/20 rounded-2xl p-3.5 mb-4 flex-row justify-around items-center">
            <View className="items-center">
              <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Versão Atual</Text>
              <Text className="text-gray-600 text-sm font-bold mt-0.5">v{currentVersion}</Text>
            </View>
            <Ionicons name="arrow-forward-outline" size={20} color="#6B224F" />
            <View className="items-center">
              <Text className="text-brand-burgundy text-[10px] uppercase font-bold tracking-wider">Nova Versão</Text>
              <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full mt-0.5">
                <Text className="text-emerald-700 text-sm font-extrabold">v{versionInfo.latestVersion}</Text>
              </View>
            </View>
          </View>

          {/* Release Notes */}
          {versionInfo.releaseNotes ? (
            <View className="mb-5">
              <Text className="text-brand-plum font-bold text-xs mb-1.5 flex-row items-center">
                ✨ Novidades desta versão:
              </Text>
              <ScrollView className="max-h-28 bg-gray-50 rounded-xl p-3 border border-gray-200">
                <Text className="text-gray-700 text-xs leading-relaxed">
                  {versionInfo.releaseNotes}
                </Text>
              </ScrollView>
            </View>
          ) : null}

          {/* Download Direct Info */}
          <View className="bg-sky-50 border border-sky-200 rounded-xl p-3 mb-5 flex-row items-center">
            <Ionicons name="cloud-download-outline" size={20} color="#0284c7" className="mr-2" />
            <Text className="text-sky-800 text-[11px] flex-1 leading-tight font-medium">
              Ao clicar em <Text className="font-bold">Baixar e Atualizar</Text>, o aplicativo irá baixar o arquivo instalável mais recente (APK).
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="gap-2">
            <TouchableOpacity
              onPress={onDownload}
              activeOpacity={0.8}
              className="bg-brand-burgundy rounded-2xl py-3.5 px-4 flex-row items-center justify-center shadow-sm"
            >
              <Ionicons name="download-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text className="text-white font-extrabold text-base">Baixar e Atualizar Agora</Text>
            </TouchableOpacity>

            {!isForceUpdate && (
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                className="py-2.5 items-center justify-center"
              >
                <Text className="text-gray-400 font-bold text-xs">Agora não (Continuar na v{currentVersion})</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
