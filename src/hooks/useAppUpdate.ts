import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import {
  fetchLatestVersionInfo,
  getCurrentVersion,
  isVersionNewer,
  VersionInfo,
} from '../services/updateService';

export function useAppUpdate(autoCheckOnMount: boolean = true) {
  const currentVersion = getCurrentVersion();
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const checkUpdate = useCallback(
    async (isManual: boolean = false) => {
      setIsChecking(true);
      try {
        const info = await fetchLatestVersionInfo();
        if (info && info.latestVersion) {
          const isNewer = isVersionNewer(currentVersion, info.latestVersion);
          setVersionInfo(info);
          setHasUpdate(isNewer);

          if (isNewer) {
            setModalVisible(true);
          } else if (isManual) {
            Alert.alert(
              'App Atualizado! 🎉',
              `Você já está utilizando a versão mais recente (${currentVersion}).`,
              [{ text: 'OK', style: 'default' }]
            );
          }
        } else if (isManual) {
          Alert.alert(
            'Servidor Indisponível',
            'Não foi possível verificar se há atualizações no momento. Verifique sua conexão e tente novamente.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      } catch (error) {
        console.warn('[useAppUpdate] Erro ao verificar atualização:', error);
        if (isManual) {
          Alert.alert('Erro', 'Ocorreu um erro ao verificar a versão do aplicativo.');
        }
      } finally {
        setIsChecking(false);
      }
    },
    [currentVersion]
  );

  const downloadAndInstall = useCallback(async () => {
    if (!versionInfo?.apkUrl) {
      // Fallback padrão para URL do APK mais recente
      const defaultApkUrl = 'http://163.176.224.111/apk/welth-v1.0.0.apk';
      try {
        await Linking.openURL(defaultApkUrl);
      } catch (err) {
        console.warn('[useAppUpdate] Erro ao abrir URL padrão do APK:', err);
        Alert.alert('Erro no Download', 'Não foi possível abrir o link de download.');
      }
      return;
    }

    try {
      const supported = await Linking.canOpenURL(versionInfo.apkUrl);
      if (supported) {
        await Linking.openURL(versionInfo.apkUrl);
      } else {
        // Tenta abrir mesmo se canOpenURL retornar false em algumas versões do Android
        await Linking.openURL(versionInfo.apkUrl);
      }
    } catch (error) {
      console.error('[useAppUpdate] Erro ao abrir URL do APK:', error);
      Alert.alert(
        'Erro ao Abrir Link',
        'Não foi possível iniciar o download. Tente novamente mais tarde ou abra no navegador.'
      );
    }
  }, [versionInfo]);

  const closeModal = useCallback(() => {
    if (versionInfo?.forceUpdate) {
      Alert.alert(
        'Atualização Obrigatória',
        'Esta atualização contém melhorias críticas e é necessária para continuar utilizando o Welth.'
      );
      return;
    }
    setModalVisible(false);
  }, [versionInfo]);

  useEffect(() => {
    if (autoCheckOnMount) {
      checkUpdate(false);
    }
  }, [autoCheckOnMount, checkUpdate]);

  return {
    currentVersion,
    versionInfo,
    hasUpdate,
    isChecking,
    modalVisible,
    checkUpdate,
    downloadAndInstall,
    closeModal,
    setModalVisible,
  };
}
