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

export interface ServiceModel {
  id?: string;
  supplierId?: string | null;
  supplierName: string;
  pieceName: string;
  processesPerPiece: number;
  pricePerPiece: number;
  status: string; // 'Pendente' | 'Em Andamento' | 'Concluído'
  createdAt?: string | Date;
  variations: ServiceVariationModel[];
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
