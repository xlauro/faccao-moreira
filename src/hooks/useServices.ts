import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getServiceTotalPieces, ServiceModel } from '../models/types';
import { serviceRepository } from '../repositories/serviceRepository';

export function useServices() {
  const [services, setServices] = useState<ServiceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const sortServicesByPriority = (list: ServiceModel[]): ServiceModel[] => {
    return [...list].sort((a, b) => {
      const getPriority = (status: string) => {
        const st = (status || '').toLowerCase().trim();
        if (st === 'em andamento' || st === 'ativo') return 1;
        if (st === 'pendente') return 2;
        if (st === 'concluído' || st === 'concluido') return 3;
        return 4;
      };

      const priorityA = getPriority(a.status);
      const priorityB = getPriority(b.status);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  };

  const fetchServices = async () => {
    try {
      const data = await serviceRepository.getAllServices();
      setServices(sortServicesByPriority(data));
    } catch (error) {
      console.error('[useServices] Erro ao buscar serviços:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchServices();

      // Recalcular e atualizar previsões no banco de dados a cada 30 minutos (1.800.000 ms)
      const interval = setInterval(() => {
        console.log('[useServices] Recalculando previsões de conclusão (a cada 30 min)...');
        fetchServices();
      }, 1800000);

      return () => clearInterval(interval);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const deleteService = (service: ServiceModel) => {
    if (!service.id) return;
    Alert.alert(
      'Excluir Lote',
      `Tem certeza que deseja excluir o lote de "${service.pieceName}" (${service.supplierName})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await serviceRepository.deleteService(service.id!);
              await fetchServices();
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível excluir o serviço.');
            }
          },
        },
      ]
    );
  };

  // Metrics
  const pendingCount = services.filter((s) => s.status.toLowerCase() === 'pendente').length;
  const activeCount = services.filter(
    (s) => s.status.toLowerCase() === 'em andamento' || s.status.toLowerCase() === 'ativo'
  ).length;
  const totalToReceive = services.reduce((sum, s) => sum + s.pricePerPiece * getServiceTotalPieces(s), 0);

  return {
    services,
    loading,
    refreshing,
    onRefresh,
    fetchServices,
    deleteService,
    pendingCount,
    activeCount,
    totalToReceive,
  };
}
