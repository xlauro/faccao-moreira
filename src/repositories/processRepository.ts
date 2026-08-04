import { sql } from '../core/database';
import { SewingProcessModel } from '../models/types';

export class ProcessRepository {
  /**
   * Fetch all global sewing processes ordered by creation date / name.
   */
  async getAllProcesses(): Promise<SewingProcessModel[]> {
    console.log('[ProcessRepository] Buscando lista de processos de costura...');
    try {
      const result = await sql`
        SELECT id, name, created_at
        FROM sewing_processes
        ORDER BY created_at ASC, name ASC
      `;

      const processes: SewingProcessModel[] = (result || []).map((row) => ({
        id: row.id.toString(),
        name: row.name as string,
        createdAt: row.created_at,
      }));

      console.log(`[ProcessRepository] Total de processos encontrados: ${processes.length}`);
      return processes;
    } catch (error) {
      console.error('[ProcessRepository] ERRO ao buscar processos de costura:', error);
      throw error;
    }
  }

  /**
   * Create a new custom sewing process if it doesn't exist.
   */
  async createProcess(name: string): Promise<SewingProcessModel> {
    const trimmedName = name.trim();
    console.log(`[ProcessRepository] Criando novo processo de costura: "${trimmedName}"...`);
    try {
      const result = await sql`
        INSERT INTO sewing_processes (name)
        VALUES (${trimmedName})
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name, created_at
      `;

      const row = result[0];
      const processItem: SewingProcessModel = {
        id: row.id.toString(),
        name: row.name as string,
        createdAt: row.created_at,
      };

      console.log(`[ProcessRepository] Processo "${trimmedName}" salvo com sucesso!`);
      return processItem;
    } catch (error) {
      console.error(`[ProcessRepository] ERRO ao criar processo "${trimmedName}":`, error);
      throw error;
    }
  }
}

export const processRepository = new ProcessRepository();
