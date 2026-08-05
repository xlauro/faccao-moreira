import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderBarProps {
  title?: string;
  onRefresh: () => void;
  onLogout: () => void;
  onCheckUpdate?: () => void;
  isCheckingUpdate?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title = 'Facção Moreira 🧵',
  onRefresh,
  onLogout,
  onCheckUpdate,
  isCheckingUpdate = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View className="bg-brand-plum">
      <StatusBar style="light" backgroundColor="#2C1435" />
      <View
        className="bg-brand-plum px-4 pb-3 flex-row justify-between items-center shadow"
        style={{ paddingTop: Math.max(insets.top, 12) }}
      >
        <Text className="text-white text-lg font-bold">{title}</Text>
        <View className="flex-row items-center">
          {onCheckUpdate && (
            <TouchableOpacity
              onPress={onCheckUpdate}
              disabled={isCheckingUpdate}
              className="p-2 mr-1"
              accessibilityLabel="Verificar atualizações"
            >
              <Ionicons
                name={isCheckingUpdate ? 'cloud-download-outline' : 'arrow-up-circle-outline'}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onRefresh} className="p-2 mr-1">
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} className="p-2">
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
