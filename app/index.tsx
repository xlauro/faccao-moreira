import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { HeaderBar } from '../src/components/common/HeaderBar';
import { HomeActionButtons } from '../src/components/home/HomeActionButtons';
import { ServiceCard } from '../src/components/home/ServiceCard';
import { SummaryStatsOverview } from '../src/components/home/SummaryStatsOverview';
import { WelcomeHeaderCard } from '../src/components/home/WelcomeHeaderCard';
import { DefectInputModal } from '../src/components/modals/DefectInputModal';
import { HistoryLogModal } from '../src/components/modals/HistoryLogModal';
import { ProcessInputModal } from '../src/components/modals/ProcessInputModal';
import { useAuth } from '../src/context/AuthContext';
import { useServiceActions } from '../src/hooks/useServiceActions';
import { useServices } from '../src/hooks/useServices';

export default function HomeScreen() {
  const { currentUser, logout } = useAuth();
  const {
    services,
    loading,
    refreshing,
    onRefresh,
    fetchServices,
    pendingCount,
    activeCount,
    totalToReceive,
  } = useServices();

  const actions = useServiceActions(fetchServices);

  return (
    <View className="flex-1 bg-gray-100">
      {/* Top Header Bar */}
      <HeaderBar title="Facção Moreira 🧵" onRefresh={fetchServices} onLogout={logout} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6B224F']} />}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Welcome Banner */}
        <WelcomeHeaderCard userName={currentUser?.name} />

        {/* Primary Action Buttons */}
        <HomeActionButtons />

        {/* Summary Metric Cards */}
        <SummaryStatsOverview
          pendingCount={pendingCount}
          activeCount={activeCount}
          totalToReceive={totalToReceive}
        />

        {/* Services Section */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-brand-plum text-base font-bold">Serviços da Facção 🧵</Text>
          <Text className="text-gray-500 font-bold text-xs">Total: {services.length}</Text>
        </View>

        {loading ? (
          <View className="py-10 items-center">
            <ActivityIndicator size="large" color="#6B224F" />
          </View>
        ) : services.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center shadow-sm">
            <Text className="text-4xl mb-3">📌</Text>
            <Text className="text-brand-plum text-base font-bold">Nenhum serviço cadastrado ainda</Text>
            <Text className="text-gray-500 text-xs text-center mt-1.5">
              {'Clique no botão "Iniciar Serviço" ou "Novo Serviço" acima para gerenciar a produção.'}
            </Text>
          </View>
        ) : (
          services.map((service) => (
            <ServiceCard
              key={service.id || Math.random().toString()}
              service={service}
              onStartServiceDirectly={actions.handleStartServiceDirectly}
              onConcludeService={actions.handleConcludeService}
              onOpenProcessModal={actions.openProcessModal}
              onOpenDefectModal={actions.openDefectModal}
              onOpenHistoryModal={actions.openHistoryModal}
            />
          ))
        )}
      </ScrollView>

      {/* Modals */}
      <ProcessInputModal
        visible={actions.processModalVisible}
        service={actions.selectedServiceForProcess}
        variation={actions.selectedVariationForProcess}
        isSaving={actions.isSavingProcess}
        onClose={() => actions.setProcessModalVisible(false)}
        onSubmit={actions.submitAddProcesses}
      />

      <DefectInputModal
        visible={actions.defectModalVisible}
        variation={actions.selectedVariationForDefect}
        countText={actions.defectInputCount}
        isSaving={actions.isSavingDefect}
        onCountTextChange={actions.setDefectInputCount}
        onClose={() => actions.setDefectModalVisible(false)}
        onSubmit={actions.submitAddDefect}
      />

      <HistoryLogModal
        visible={actions.historyModalVisible}
        service={actions.selectedServiceForHistory}
        logs={actions.historyLogs}
        loading={actions.loadingHistory}
        onClose={() => actions.setHistoryModalVisible(false)}
      />
    </View>
  );
}
