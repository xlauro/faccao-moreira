import { sql } from '../core/database';
import { ServiceLogModel, ServiceModel, ServiceVariationModel } from '../models/types';

function parseIntVal(val: any, defaultValue = 1): number {
  if (val === null || val === undefined) return defaultValue;
  if (typeof val === 'number') return Math.floor(val);
  if (typeof val === 'string') {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

function parseFloatVal(val: any): number {
  if (val === null || val === undefined) return 0.0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0.0 : parsed;
  }
  return 0.0;
}

export class ServiceRepository {
  /**
   * Create a new global service with its variations.
   * Status enters directly as 'Pendente'.
   */
  async createService({
    supplierId,
    supplierName,
    pieceName,
    processesPerPiece = 1,
    pricePerPiece = 0.0,
    variations,
    selectedProcesses = [],
  }: {
    supplierId?: string | null;
    supplierName: string;
    pieceName: string;
    processesPerPiece?: number;
    pricePerPiece?: number;
    variations: ServiceVariationModel[];
    selectedProcesses?: string[];
  }): Promise<ServiceModel> {
    const calculatedProcesses = selectedProcesses.length > 0 ? selectedProcesses.length : processesPerPiece;
    console.log(
      `[ServiceRepository] Criando novo serviço: peça="${pieceName}", fornecedor="${supplierName}", proc/peça=${calculatedProcesses}, valor/peça=${pricePerPiece}, variações=${variations.length}`
    );

    try {
      // Insert service record (status = 'Pendente')
      const result = await sql`
        INSERT INTO services (supplier_id, supplier_name, piece_name, processes_per_piece, price_per_piece, status)
        VALUES (${supplierId || null}, ${supplierName.trim()}, ${pieceName.trim()}, ${calculatedProcesses}, ${pricePerPiece}, 'Pendente')
        RETURNING id, supplier_id, supplier_name, piece_name, processes_per_piece, price_per_piece, status, created_at
      `;

      const row = result[0];
      const serviceId = row.id.toString();

      // Insert selected processes
      for (const procName of selectedProcesses) {
        await sql`
          INSERT INTO service_selected_processes (service_id, process_name)
          VALUES (${serviceId}::uuid, ${procName.trim()})
        `;
      }

      const createdVariations: ServiceVariationModel[] = [];

      for (const variation of variations) {
        const varResult = await sql`
          INSERT INTO service_variations (service_id, color, size, quantity)
          VALUES (${serviceId}::uuid, ${variation.color.trim()}, ${variation.size.trim()}, ${variation.quantity})
          RETURNING id, service_id, color, size, quantity, completed_processes, defects
        `;

        const varRow = varResult[0];
        createdVariations.push({
          id: varRow.id.toString(),
          serviceId: varRow.service_id.toString(),
          color: varRow.color as string,
          size: varRow.size as string,
          quantity: parseIntVal(varRow.quantity, 1),
          completedProcesses: parseIntVal(varRow.completed_processes, 0),
          defects: parseIntVal(varRow.defects, 0),
        });
      }

      const service: ServiceModel = {
        id: serviceId,
        supplierId: row.supplier_id?.toString() || null,
        supplierName: row.supplier_name as string,
        pieceName: row.piece_name as string,
        processesPerPiece: parseIntVal(row.processes_per_piece, 1),
        pricePerPiece: parseFloatVal(row.price_per_piece),
        status: row.status as string,
        createdAt: row.created_at,
        variations: createdVariations,
        selectedProcesses,
      };

      console.log(`[ServiceRepository] Serviço criado com sucesso como Pendente! id=${service.id}`);
      return service;
    } catch (error) {
      console.error('[ServiceRepository] ERRO ao criar novo serviço:', error);
      throw error;
    }
  }

  /**
   * Update an existing service and its variations.
   */
  async updateService({
    id,
    supplierId,
    supplierName,
    pieceName,
    processesPerPiece,
    pricePerPiece,
    status,
    variations,
    selectedProcesses = [],
  }: {
    id: string;
    supplierId?: string | null;
    supplierName: string;
    pieceName: string;
    processesPerPiece: number;
    pricePerPiece: number;
    status: string;
    variations: ServiceVariationModel[];
    selectedProcesses?: string[];
  }): Promise<ServiceModel> {
    const calculatedProcesses = selectedProcesses.length > 0 ? selectedProcesses.length : processesPerPiece;
    console.log(`[ServiceRepository] Atualizando serviço: id=${id}, peça="${pieceName}", status="${status}"`);
    try {
      await sql`
        UPDATE services
        SET supplier_id = ${supplierId || null},
            supplier_name = ${supplierName.trim()},
            piece_name = ${pieceName.trim()},
            processes_per_piece = ${calculatedProcesses},
            price_per_piece = ${pricePerPiece},
            status = ${status}
        WHERE id = ${id}::uuid
      `;

      // Re-insert selected processes
      await sql`
        DELETE FROM service_selected_processes WHERE service_id = ${id}::uuid
      `;
      for (const procName of selectedProcesses) {
        await sql`
          INSERT INTO service_selected_processes (service_id, process_name)
          VALUES (${id}::uuid, ${procName.trim()})
        `;
      }

      // Delete existing variations & re-insert
      await sql`
        DELETE FROM service_variations WHERE service_id = ${id}::uuid
      `;

      const updatedVariations: ServiceVariationModel[] = [];
      for (const variation of variations) {
        const varResult = await sql`
          INSERT INTO service_variations (service_id, color, size, quantity, completed_processes, defects)
          VALUES (
            ${id}::uuid,
            ${variation.color.trim()},
            ${variation.size.trim()},
            ${variation.quantity},
            ${variation.completedProcesses || 0},
            ${variation.defects || 0}
          )
          RETURNING id, service_id, color, size, quantity, completed_processes, defects
        `;

        const varRow = varResult[0];
        updatedVariations.push({
          id: varRow.id.toString(),
          serviceId: varRow.service_id.toString(),
          color: varRow.color as string,
          size: varRow.size as string,
          quantity: parseIntVal(varRow.quantity, 1),
          completedProcesses: parseIntVal(varRow.completed_processes, 0),
          defects: parseIntVal(varRow.defects, 0),
        });
      }

      const updatedService: ServiceModel = {
        id,
        supplierId: supplierId || null,
        supplierName,
        pieceName,
        processesPerPiece: calculatedProcesses,
        pricePerPiece,
        status,
        variations: updatedVariations,
        selectedProcesses,
      };

      console.log(`[ServiceRepository] Serviço ${id} atualizado com sucesso!`);
      return updatedService;
    } catch (error) {
      console.error(`[ServiceRepository] ERRO ao atualizar serviço ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all global services ordered by creation date (newest first).
   */
  async getAllServices(): Promise<ServiceModel[]> {
    console.log('[ServiceRepository] Buscando lista global de serviços...');
    try {
      const servicesResult = await sql`
        SELECT id, supplier_id, supplier_name, piece_name, processes_per_piece, price_per_piece, status, estimated_completion_date, final_total_price, completed_at, created_at
        FROM services
        ORDER BY created_at DESC
      `;

      if (!servicesResult || servicesResult.length === 0) {
        console.log('[ServiceRepository] Nenhum serviço cadastrado.');
        return [];
      }

      const servicesList: ServiceModel[] = [];

      for (const row of servicesResult) {
        const sId = row.id.toString();

        const varsResult = await sql`
          SELECT id, service_id, color, size, quantity, completed_processes, defects
          FROM service_variations
          WHERE service_id = ${sId}::uuid
        `;

        const vars: ServiceVariationModel[] = (varsResult || []).map((vRow) => ({
          id: vRow.id.toString(),
          serviceId: vRow.service_id.toString(),
          color: vRow.color as string,
          size: vRow.size as string,
          quantity: parseIntVal(vRow.quantity, 1),
          completedProcesses: parseIntVal(vRow.completed_processes, 0),
          defects: parseIntVal(vRow.defects, 0),
        }));

        const procsResult = await sql`
          SELECT process_name
          FROM service_selected_processes
          WHERE service_id = ${sId}::uuid
          ORDER BY created_at ASC
        `;

        const selProcs: string[] = (procsResult || []).map((pRow) => pRow.process_name as string);

        const logsResult = await sql`
          SELECT id, service_id, variation_id, seamstress_name, processes_count, variation_description, created_at
          FROM service_logs
          WHERE service_id = ${sId}::uuid
          ORDER BY created_at DESC
        `;

        const serviceLogs: ServiceLogModel[] = (logsResult || []).map((lRow) => ({
          id: lRow.id.toString(),
          serviceId: lRow.service_id.toString(),
          variationId: lRow.variation_id?.toString(),
          seamstressName: lRow.seamstress_name as string,
          processesCount: parseIntVal(lRow.processes_count, 0),
          variationDescription: lRow.variation_description as string,
          createdAt: lRow.created_at,
        }));

        servicesList.push({
          id: sId,
          supplierId: row.supplier_id?.toString() || null,
          supplierName: row.supplier_name as string,
          pieceName: row.piece_name as string,
          processesPerPiece: parseIntVal(row.processes_per_piece, 1),
          pricePerPiece: parseFloatVal(row.price_per_piece),
          status: row.status as string,
          estimatedCompletionDate: row.estimated_completion_date,
          finalTotalPrice: row.final_total_price !== null && row.final_total_price !== undefined ? parseFloatVal(row.final_total_price) : null,
          completedAt: row.completed_at,
          createdAt: row.created_at,
          variations: vars,
          selectedProcesses: selProcs,
          logs: serviceLogs,
        });
      }

      console.log(`[ServiceRepository] Total de serviços encontrados: ${servicesList.length}`);
      return servicesList;
    } catch (error) {
      console.error('[ServiceRepository] ERRO ao buscar serviços:', error);
      throw error;
    }
  }

  /**
   * Update service status
   */
  async updateServiceStatus(id: string, status: string): Promise<void> {
    console.log(`[ServiceRepository] Alterando status do serviço ${id} para "${status}"...`);
    try {
      if (status.toLowerCase() === 'concluído' || status.toLowerCase() === 'concluido') {
        await sql`
          UPDATE services
          SET status = ${status}, completed_at = CURRENT_TIMESTAMP
          WHERE id = ${id}::uuid
        `;
      } else {
        await sql`
          UPDATE services SET status = ${status} WHERE id = ${id}::uuid
        `;
      }
      console.log(`[ServiceRepository] Status do serviço ${id} alterado com sucesso!`);
    } catch (error) {
      console.error(`[ServiceRepository] ERRO ao alterar status do serviço ${id}:`, error);
      throw error;
    }
  }

  /**
   * Increment completed processes for a variation and log seamstress activity.
   */
  async addCompletedProcesses({
    serviceId,
    variationId,
    seamstressName,
    addedProcesses,
    variationDescription,
  }: {
    serviceId: string;
    variationId: string;
    seamstressName: string;
    addedProcesses: number;
    variationDescription: string;
  }): Promise<void> {
    console.log(`[ServiceRepository] Adicionando ${addedProcesses} processos à variação ${variationId} por "${seamstressName}"...`);
    try {
      await sql`
        UPDATE service_variations
        SET completed_processes = completed_processes + ${addedProcesses}
        WHERE id = ${variationId}::uuid
      `;

      await sql`
        INSERT INTO service_logs (service_id, variation_id, seamstress_name, processes_count, variation_description)
        VALUES (${serviceId}::uuid, ${variationId}::uuid, ${seamstressName.trim()}, ${addedProcesses}, ${variationDescription.trim()})
      `;

      console.log(`[ServiceRepository] Processos da variação ${variationId} atualizados e log registrado com sucesso!`);
    } catch (error) {
      console.error(`[ServiceRepository] ERRO ao adicionar processos à variação ${variationId}:`, error);
      throw error;
    }
  }

  /**
   * Get activity logs for a specific service.
   */
  async getServiceLogs(serviceId: string): Promise<ServiceLogModel[]> {
    console.log(`[ServiceRepository] Buscando logs do serviço ${serviceId}...`);
    try {
      const result = await sql`
        SELECT id, service_id, variation_id, seamstress_name, processes_count, variation_description, created_at
        FROM service_logs
        WHERE service_id = ${serviceId}::uuid
        ORDER BY created_at DESC
      `;

      const logs: ServiceLogModel[] = (result || []).map((row) => ({
        id: row.id.toString(),
        serviceId: row.service_id.toString(),
        variationId: row.variation_id?.toString() || undefined,
        seamstressName: row.seamstress_name as string,
        processesCount: parseIntVal(row.processes_count, 0),
        variationDescription: row.variation_description as string,
        createdAt: row.created_at,
      }));

      console.log(`[ServiceRepository] Total de logs encontrados para serviço ${serviceId}: ${logs.length}`);
      return logs;
    } catch (error) {
      console.error(`[ServiceRepository] ERRO ao buscar logs do serviço ${serviceId}:`, error);
      return [];
    }
  }

  /**
   * Increment defect count for a variation.
   */
  async addVariationDefect({
    variationId,
    addedDefects,
  }: {
    variationId: string;
    addedDefects: number;
  }): Promise<void> {
    console.log(`[ServiceRepository] Registrando ${addedDefects} defeitos na variação ${variationId}...`);
    try {
      await sql`
        UPDATE service_variations
        SET defects = defects + ${addedDefects}
        WHERE id = ${variationId}::uuid
      `;
      console.log(`[ServiceRepository] Defeitos da variação ${variationId} atualizados com sucesso!`);
    } catch (error) {
      console.error(`[ServiceRepository] ERRO ao registrar defeito na variação ${variationId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a service and its variations by ID.
   */
  async deleteService(id: string): Promise<void> {
    console.log(`[ServiceRepository] Deletando serviço id=${id}...`);
    try {
      await sql`
        DELETE FROM service_variations WHERE service_id = ${id}::uuid
      `;
      await sql`
        DELETE FROM services WHERE id = ${id}::uuid
      `;
    } catch (error) {
      console.error(`[ServiceRepository] ERRO ao deletar serviço ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update the estimated completion timestamp in NeonDB.
   */
  async updateServiceEstimatedCompletion(serviceId: string, estimatedDate: Date | null): Promise<void> {
    console.log(`[ServiceRepository] Atualizando data prevista de conclusão do serviço ${serviceId}...`);
    try {
      const dateStr = estimatedDate ? estimatedDate.toISOString() : null;
      await sql`
        UPDATE services
        SET estimated_completion_date = ${dateStr}
        WHERE id = ${serviceId}::uuid
      `;
    } catch (error) {
      console.error(`[ServiceRepository] Erro ao atualizar estimated_completion_date no serviço ${serviceId}:`, error);
    }
  }

  /**
   * Update final total price/earnings for a completed service batch.
   */
  async updateServiceFinalTotalPrice(serviceId: string, finalPrice: number): Promise<void> {
    console.log(`[ServiceRepository] Atualizando valor final ganho do serviço ${serviceId} para R$ ${finalPrice}...`);
    try {
      await sql`
        UPDATE services
        SET final_total_price = ${finalPrice}
        WHERE id = ${serviceId}::uuid
      `;
    } catch (error) {
      console.error(`[ServiceRepository] Erro ao atualizar final_total_price no serviço ${serviceId}:`, error);
      throw error;
    }
  }
}

export const serviceRepository = new ServiceRepository();
