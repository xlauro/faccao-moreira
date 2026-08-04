import { sql } from '../core/database';
import { SupplierModel } from '../models/types';

export class SupplierRepository {
  async createSupplier({ name, phone }: { name: string; phone: string }): Promise<SupplierModel> {
    console.log(`[SupplierRepository] Cadastrando novo fornecedor: name=${name}, phone=${phone}`);
    try {
      const result = await sql`
        INSERT INTO suppliers (name, phone)
        VALUES (${name.trim()}, ${phone.trim()})
        RETURNING id, name, phone, created_at
      `;

      const row = result[0];
      const supplier: SupplierModel = {
        id: row.id?.toString(),
        name: row.name as string,
        phone: row.phone as string,
        createdAt: row.created_at,
      };

      console.log(`[SupplierRepository] Fornecedor cadastrado com sucesso! id=${supplier.id}`);
      return supplier;
    } catch (error) {
      console.error(`[SupplierRepository] ERRO ao cadastrar fornecedor ${name}:`, error);
      throw error;
    }
  }

  async getAllSuppliers(): Promise<SupplierModel[]> {
    console.log('[SupplierRepository] Buscando todos os fornecedores...');
    try {
      const result = await sql`
        SELECT id, name, phone, created_at
        FROM suppliers
        ORDER BY name ASC
      `;

      const suppliers: SupplierModel[] = (result || []).map((row) => ({
        id: row.id?.toString(),
        name: row.name as string,
        phone: row.phone as string,
        createdAt: row.created_at,
      }));

      console.log(`[SupplierRepository] Total de fornecedores encontrados: ${suppliers.length}`);
      return suppliers;
    } catch (error) {
      console.error('[SupplierRepository] ERRO ao buscar fornecedores:', error);
      throw error;
    }
  }
}

export const supplierRepository = new SupplierRepository();
