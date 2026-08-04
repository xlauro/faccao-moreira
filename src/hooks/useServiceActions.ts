import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  getEffectiveQuantity,
  getServiceOverallProgressPercentage,
  getServiceTotalPieces,
  getServiceTotalProcesses,
  ServiceLogModel,
  ServiceModel,
  ServiceVariationModel,
} from '../models/types';
import { serviceRepository } from '../repositories/serviceRepository';
import { formatCurrency } from '../utils/currencyFormatter';
import { getGarmentEmoji } from '../utils/garmentIconHelper';

export function useServiceActions(onServicesUpdated: () => void) {
  const { currentUser } = useAuth();

  // Process Dialog State
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [selectedServiceForProcess, setSelectedServiceForProcess] = useState<ServiceModel | null>(null);
  const [selectedVariationForProcess, setSelectedVariationForProcess] = useState<ServiceVariationModel | null>(null);
  const [processInputCount, setProcessInputCount] = useState('1');
  const [isSavingProcess, setIsSavingProcess] = useState(false);

  // Defect Dialog State
  const [defectModalVisible, setDefectModalVisible] = useState(false);
  const [selectedServiceForDefect, setSelectedServiceForDefect] = useState<ServiceModel | null>(null);
  const [selectedVariationForDefect, setSelectedVariationForDefect] = useState<ServiceVariationModel | null>(null);
  const [defectInputCount, setDefectInputCount] = useState('1');
  const [isSavingDefect, setIsSavingDefect] = useState(false);

  // History Dialog State
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedServiceForHistory, setSelectedServiceForHistory] = useState<ServiceModel | null>(null);
  const [historyLogs, setHistoryLogs] = useState<ServiceLogModel[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleStartServiceDirectly = async (service: ServiceModel) => {
    if (!service.id) return;
    const garmentEmoji = getGarmentEmoji(service.pieceName);

    Alert.alert(
      `${garmentEmoji} Iniciar Serviço?`,
      `Deseja iniciar a produção da peça "${service.pieceName}"?\n\n` +
        `• Fornecedor: ${service.supplierName}\n` +
        `• Total de Peças: ${getServiceTotalPieces(service)} un.\n` +
        `• Total de Processos: ${getServiceTotalProcesses(service)}\n` +
        `• Valor do Lote: ${formatCurrency(getServiceTotalPieces(service) * service.pricePerPiece)}\n\n` +
        `O status mudará de "Pendente 📌" para "Em Andamento ✂️", liberando o lançamento de processos e defeitos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar Serviço 🚀',
          onPress: async () => {
            try {
              await serviceRepository.updateServiceStatus(service.id!, 'Em Andamento');
              onServicesUpdated();
              Alert.alert('Sucesso', `Serviço "${service.pieceName}" iniciado! ✂️🚀`);
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível iniciar o serviço.');
            }
          },
        },
      ]
    );
  };

  const handleConcludeService = async (service: ServiceModel) => {
    if (!service.id) return;
    const garmentEmoji = getGarmentEmoji(service.pieceName);

    Alert.alert(
      `${garmentEmoji} Concluir Serviço?`,
      `Deseja marcar o serviço "${service.pieceName}" como Concluído ✅?\n\n` +
        `• Fornecedor: ${service.supplierName}\n` +
        `• Progresso do Lote: ${getServiceOverallProgressPercentage(service).toFixed(1)}%\n` +
        `• Total de Peças: ${getServiceTotalPieces(service)} un.\n` +
        `• Valor do Lote: ${formatCurrency(getServiceTotalPieces(service) * service.pricePerPiece)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Concluir Serviço ✅',
          onPress: async () => {
            try {
              await serviceRepository.updateServiceStatus(service.id!, 'Concluído');
              onServicesUpdated();
              Alert.alert('Sucesso', `Serviço "${service.pieceName}" marcado como Concluído! ✅🎉`);
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível concluir o serviço.');
            }
          },
        },
      ]
    );
  };

  const openProcessModal = (service: ServiceModel, variation: ServiceVariationModel) => {
    if (service.status.toLowerCase() !== 'em andamento') {
      Alert.alert('Aviso', 'Serviços não iniciados ou concluídos não podem receber processos.');
      return;
    }
    setSelectedServiceForProcess(service);
    setSelectedVariationForProcess(variation);
    setProcessModalVisible(true);
  };

  const submitAddProcesses = async (totalCount: number, breakdownDescription: string) => {
    if (
      !selectedServiceForProcess ||
      !selectedServiceForProcess.id ||
      !selectedVariationForProcess ||
      !selectedVariationForProcess.id
    )
      return;

    if (totalCount <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade maior que 0.');
      return;
    }

    setIsSavingProcess(true);
    try {
      const seamstressName = currentUser?.name || 'Costureira';
      const baseDesc = `${selectedVariationForProcess.color} (${selectedVariationForProcess.size})`;
      const varDesc = breakdownDescription ? `${baseDesc} - [${breakdownDescription}]` : baseDesc;

      await serviceRepository.addCompletedProcesses({
        serviceId: selectedServiceForProcess.id,
        variationId: selectedVariationForProcess.id,
        seamstressName,
        addedProcesses: totalCount,
        variationDescription: varDesc,
      });

      setProcessModalVisible(false);
      onServicesUpdated();
      Alert.alert(
        'Sucesso',
        `+${totalCount} processos adicionados para ${selectedVariationForProcess.color} (${selectedVariationForProcess.size})! 🧵✨`
      );
    } catch (e) {
      Alert.alert('Erro', 'Erro ao adicionar processos.');
    } finally {
      setIsSavingProcess(false);
    }
  };

  const openDefectModal = (service: ServiceModel, variation: ServiceVariationModel) => {
    if (service.status.toLowerCase() !== 'em andamento') {
      Alert.alert('Aviso', 'Serviços não iniciados ou concluídos não podem registrar defeitos.');
      return;
    }
    setSelectedServiceForDefect(service);
    setSelectedVariationForDefect(variation);
    setDefectInputCount('1');
    setDefectModalVisible(true);
  };

  const submitAddDefect = async () => {
    if (!selectedVariationForDefect || !selectedVariationForDefect.id) return;
    const count = parseInt(defectInputCount.trim(), 10);
    if (isNaN(count) || count <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade maior que 0.');
      return;
    }
    if (count > getEffectiveQuantity(selectedVariationForDefect)) {
      Alert.alert('Atenção', `Quantidade maior que as peças disponíveis (${getEffectiveQuantity(selectedVariationForDefect)}).`);
      return;
    }

    setIsSavingDefect(true);
    try {
      await serviceRepository.addVariationDefect({
        variationId: selectedVariationForDefect.id,
        addedDefects: count,
      });

      setDefectModalVisible(false);
      onServicesUpdated();
      Alert.alert('Sucesso', `${count} peça(s) com defeito registrada(s)! ⚠️`);
    } catch (e) {
      Alert.alert('Erro', 'Erro ao registrar defeito.');
    } finally {
      setIsSavingDefect(false);
    }
  };

  const openHistoryModal = async (service: ServiceModel) => {
    if (!service.id) return;
    setSelectedServiceForHistory(service);
    setHistoryModalVisible(true);
    setLoadingHistory(true);
    try {
      const logs = await serviceRepository.getServiceLogs(service.id);
      setHistoryLogs(logs);
    } catch (e) {
      setHistoryLogs([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return {
    // Process Modal
    processModalVisible,
    setProcessModalVisible,
    selectedServiceForProcess,
    selectedVariationForProcess,
    processInputCount,
    setProcessInputCount,
    isSavingProcess,
    openProcessModal,
    submitAddProcesses,

    // Defect Modal
    defectModalVisible,
    setDefectModalVisible,
    selectedServiceForDefect,
    selectedVariationForDefect,
    defectInputCount,
    setDefectInputCount,
    isSavingDefect,
    openDefectModal,
    submitAddDefect,

    // History Modal
    historyModalVisible,
    setHistoryModalVisible,
    selectedServiceForHistory,
    historyLogs,
    loadingHistory,
    openHistoryModal,

    // Service Lifecycle Actions
    handleStartServiceDirectly,
    handleConcludeService,
  };
}
