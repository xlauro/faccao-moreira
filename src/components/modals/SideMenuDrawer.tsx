import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface SideMenuDrawerProps {
  visible: boolean;
  userName?: string;
  userEmail?: string;
  currentVersion: string;
  hasUpdate?: boolean;
  onClose: () => void;
  onOpenAbout: () => void;
  onCheckUpdate: () => void;
  onLogout: () => void;
}

export const SideMenuDrawer: React.FC<SideMenuDrawerProps> = ({
  visible,
  userName,
  userEmail,
  currentVersion,
  hasUpdate = false,
  onClose,
  onOpenAbout,
  onCheckUpdate,
  onLogout,
}) => {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path as any);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 flex-row bg-black/60">
        {/* Menu Content Drawer (Sliding Panel) */}
        <View className="w-4/5 max-w-xs bg-[#2C1435] h-full p-5 justify-between shadow-2xl">
          <View>
            {/* Header & Close Button */}
            <View className="flex-row justify-between items-center mb-6 pt-6">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-3 border border-white/10">
                  <Text className="text-xl">🧵</Text>
                </View>
                <View>
                  <Text className="text-white text-xl font-black tracking-tight">Welth</Text>
                  <Text className="text-white/60 text-[10px] uppercase font-bold tracking-widest">
                    Facção Moreira
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* User Profile Card */}
            <View className="bg-white/10 rounded-2xl p-3.5 mb-6 border border-white/10 flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-[#6B224F] justify-center items-center mr-3 border border-white/20">
                <Text className="text-white text-base font-bold">
                  {userName ? userName.trim()[0].toUpperCase() : 'C'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-sm" numberOfLines={1}>
                  {userName || 'Costureira'}
                </Text>
                {userEmail ? (
                  <Text className="text-white/60 text-[11px]" numberOfLines={1}>
                    {userEmail}
                  </Text>
                ) : (
                  <Text className="text-white/60 text-[11px]">Operador Ativo</Text>
                )}
              </View>
            </View>

            {/* Navigation Menu List */}
            <View className="gap-1.5">
              <TouchableOpacity
                onPress={() => handleNavigate('/')}
                activeOpacity={0.7}
                className="flex-row items-center px-3.5 py-3 rounded-xl bg-white/5 active:bg-white/10"
              >
                <Ionicons name="home-outline" size={20} color="#ffffff" style={{ marginRight: 12 }} />
                <Text className="text-white font-semibold text-sm">Início / Lotes Ativos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleNavigate('/suppliers')}
                activeOpacity={0.7}
                className="flex-row items-center px-3.5 py-3 rounded-xl bg-white/5 active:bg-white/10"
              >
                <Ionicons name="people-outline" size={20} color="#ffffff" style={{ marginRight: 12 }} />
                <Text className="text-white font-semibold text-sm">Gerenciar Fornecedores</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleNavigate('/completed-services')}
                activeOpacity={0.7}
                className="flex-row items-center px-3.5 py-3 rounded-xl bg-white/5 active:bg-white/10"
              >
                <Ionicons name="checkmark-done-circle-outline" size={20} color="#ffffff" style={{ marginRight: 12 }} />
                <Text className="text-white font-semibold text-sm">Serviços Concluídos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleNavigate('/create-service')}
                activeOpacity={0.7}
                className="flex-row items-center px-3.5 py-3 rounded-xl bg-white/5 active:bg-white/10"
              >
                <Ionicons name="add-circle-outline" size={20} color="#ffffff" style={{ marginRight: 12 }} />
                <Text className="text-white font-semibold text-sm">Novo Lote de Serviço</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View className="h-[1px] bg-white/10 my-2" />

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onCheckUpdate();
                }}
                activeOpacity={0.7}
                className="flex-row items-center px-3.5 py-3 rounded-xl bg-white/5 active:bg-white/10 justify-between"
              >
                <View className="flex-row items-center">
                  <Ionicons name="arrow-up-circle-outline" size={20} color="#ffffff" style={{ marginRight: 12 }} />
                  <Text className="text-white font-semibold text-sm">Verificar Atualizações</Text>
                </View>
                {hasUpdate && (
                  <View className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onOpenAbout();
                }}
                activeOpacity={0.7}
                className="flex-row items-center px-3.5 py-3 rounded-xl bg-white/5 active:bg-white/10"
              >
                <Ionicons name="information-circle-outline" size={20} color="#ffffff" style={{ marginRight: 12 }} />
                <Text className="text-white font-semibold text-sm">Sobre o App</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer & Logout */}
          <View className="gap-3 border-t border-white/10 pt-4">
            <TouchableOpacity
              onPress={() => {
                onClose();
                onLogout();
              }}
              activeOpacity={0.7}
              className="flex-row items-center px-3.5 py-3 rounded-xl bg-red-500/20 active:bg-red-500/30"
            >
              <Ionicons name="log-out-outline" size={20} color="#f87171" style={{ marginRight: 12 }} />
              <Text className="text-red-300 font-bold text-sm">Sair da Conta</Text>
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-white/40 text-[10px] font-semibold">
                Welth v{currentVersion} • Facção Moreira
              </Text>
            </View>
          </View>
        </View>

        {/* Backdrop click to dismiss */}
        <TouchableOpacity className="flex-1" onPress={onClose} activeOpacity={1} />
      </View>
    </Modal>
  );
};
