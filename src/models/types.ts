export interface UserModel {
  id?: string;
  name: string;
  email: string;
  createdAt?: string | Date;
}

export interface SupplierModel {
  id?: string;
  name: string;
  phone: string;
  createdAt?: string | Date;
}

export interface ServiceVariationModel {
  id?: string;
  serviceId?: string;
  color: string;
  size: string;
  quantity: number;
  completedProcesses: number;
  defects: number;
}

export interface SewingProcessModel {
  id?: string;
  name: string;
  createdAt?: string | Date;
}

export interface ServiceModel {
  id?: string;
  supplierId?: string | null;
  supplierName: string;
  pieceName: string;
  processesPerPiece: number;
  pricePerPiece: number;
  status: string; // 'Pendente' | 'Em Andamento' | 'Concluído'
  estimatedCompletionDate?: string | Date;
  finalTotalPrice?: number | null;
  completedAt?: string | Date;
  createdAt?: string | Date;
  variations: ServiceVariationModel[];
  selectedProcesses?: string[];
  logs?: ServiceLogModel[];
}

export interface ServiceLogModel {
  id?: string;
  serviceId: string;
  variationId?: string;
  seamstressName: string;
  processesCount: number;
  variationDescription: string;
  createdAt: string | Date;
}

// Derived helpers matching Dart model getters
export function getEffectiveQuantity(v: ServiceVariationModel): number {
  const effective = v.quantity - (v.defects || 0);
  return effective < 0 ? 0 : effective;
}

export function getVariationTotalProcesses(v: ServiceVariationModel, processesPerPiece: number): number {
  return getEffectiveQuantity(v) * processesPerPiece;
}

export function getVariationProgressPercentage(v: ServiceVariationModel, processesPerPiece: number): number {
  const total = getVariationTotalProcesses(v, processesPerPiece);
  if (total <= 0) return 0;
  const pct = (v.completedProcesses / total) * 100;
  return pct > 100 ? 100 : pct;
}

export function getServiceTotalPieces(service: ServiceModel): number {
  return service.variations.reduce((sum, v) => sum + getEffectiveQuantity(v), 0);
}

export function getServiceOriginalTotalPieces(service: ServiceModel): number {
  return service.variations.reduce((sum, v) => sum + v.quantity, 0);
}

export function getServiceTotalDefects(service: ServiceModel): number {
  return service.variations.reduce((sum, v) => sum + (v.defects || 0), 0);
}

export function getServiceTotalProcesses(service: ServiceModel): number {
  return getServiceTotalPieces(service) * service.processesPerPiece;
}

export function getServiceTotalCompletedProcesses(service: ServiceModel): number {
  return service.variations.reduce((sum, v) => sum + (v.completedProcesses || 0), 0);
}

export function getServiceOverallProgressPercentage(service: ServiceModel): number {
  const totalProc = getServiceTotalProcesses(service);
  if (totalProc <= 0) return 0;
  const pct = (getServiceTotalCompletedProcesses(service) / totalProc) * 100;
  return pct > 100 ? 100 : pct;
}

export function getServiceTotalPrice(service: ServiceModel): number {
  return getServiceTotalPieces(service) * service.pricePerPiece;
}

export function getServiceEffectiveTotalPrice(service: ServiceModel): number {
  if (service.finalTotalPrice !== null && service.finalTotalPrice !== undefined) {
    return service.finalTotalPrice;
  }
  return getServiceTotalPrice(service);
}

export function formatDurationMs(ms: number): string {
  if (ms <= 0) return '0 min';
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} dia${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}min`);

  return parts.join(' e ');
}

export function getServiceDurationText(service: ServiceModel): string {
  const startDate = service.createdAt ? new Date(service.createdAt).getTime() : Date.now();
  const endDate = service.completedAt ? new Date(service.completedAt).getTime() : Date.now();
  const diffMs = Math.max(0, endDate - startDate);
  return formatDurationMs(diffMs);
}

export interface EstimatedCompletionResult {
  formattedDate: string;
  isDefault: boolean;
  rateText: string;
  daysRemaining: number;
  date?: Date | null;
}

export function getServiceEstimatedCompletion(
  service: ServiceModel,
  logs?: ServiceLogModel[]
): EstimatedCompletionResult {
  const totalProc = getServiceTotalProcesses(service);
  const completedProc = getServiceTotalCompletedProcesses(service);

  if (service.status.toLowerCase() === 'concluído' || (totalProc > 0 && completedProc >= totalProc)) {
    return {
      formattedDate: 'Concluído ✅',
      isDefault: false,
      rateText: 'Finalizado',
      daysRemaining: 0,
      date: null,
    };
  }

  if (service.status.toLowerCase() === 'pendente') {
    return {
      formattedDate: 'Pendente 📌',
      isDefault: true,
      rateText: 'Aguardando início',
      daysRemaining: 7,
      date: null,
    };
  }

  const remainingProc = Math.max(0, totalProc - completedProc);
  const effectiveLogs = logs || service.logs || [];

  // Se nenhum processo foi concluído ou não há logs: Previsão padrão de 1 semana (7 dias) após início
  if (completedProc === 0 || effectiveLogs.length === 0) {
    const baseDate = service.createdAt ? new Date(service.createdAt) : new Date();
    const estDate = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const day = String(estDate.getDate()).padStart(2, '0');
    const month = String(estDate.getMonth() + 1).padStart(2, '0');
    const year = estDate.getFullYear();

    return {
      formattedDate: `${day}/${month}/${year}`,
      isDefault: true,
      rateText: 'Padrão (1 semana)',
      daysRemaining: 7,
      date: estDate,
    };
  }

  // Calcular taxa com base nos logs
  const sortedLogs = [...effectiveLogs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const firstLogTime = new Date(sortedLogs[0].createdAt).getTime();

  // Tempo decorrido em horas (mínimo de 30 min para evitar divisão por zero em primeiros testes)
  const elapsedMs = Math.max(1000 * 60 * 30, Date.now() - firstLogTime);
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  // Taxa horária de processos
  const hourlyRate = completedProc / elapsedHours;

  // Assumindo 8h de trabalho por dia útil na facção
  const dailyRate = Math.max(1, hourlyRate * 8);

  const daysRemaining = Math.max(1, Math.ceil(remainingProc / dailyRate));
  const estDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);

  const day = String(estDate.getDate()).padStart(2, '0');
  const month = String(estDate.getMonth() + 1).padStart(2, '0');
  const year = estDate.getFullYear();

  return {
    formattedDate: `${day}/${month}/${year}`,
    isDefault: false,
    rateText: `${Math.round(hourlyRate)} proc/h (~${daysRemaining} dia${daysRemaining > 1 ? 's' : ''})`,
    daysRemaining,
    date: estDate,
  };
}
