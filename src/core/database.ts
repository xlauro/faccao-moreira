import { neon } from '@neondatabase/serverless';

const DB_URL =
  'postgresql://neondb_owner:npg_3xil4MqRGchr@ep-silent-credit-acfwo7oz-pooler.sa-east-1.aws.neon.tech/gerenciamento_costura_db?sslmode=require';

export const sql = neon(DB_URL);

/**
 * Ensures table existence and migrations match the Flutter app's DatabaseService.
 */
export async function initDatabase(): Promise<void> {
  try {
    console.log('[DatabaseService] Inicializando verificação de tabelas e migrações...');

    // 1. Table users
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Table suppliers
    await sql`
      CREATE TABLE IF NOT EXISTS suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 3. Table services
    await sql`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
        supplier_name VARCHAR(255) NOT NULL,
        piece_name VARCHAR(255) NOT NULL,
        processes_per_piece INT NOT NULL DEFAULT 1,
        price_per_piece NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) NOT NULL DEFAULT 'Pendente',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 4. Table service_variations
    await sql`
      CREATE TABLE IF NOT EXISTS service_variations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        color VARCHAR(100) NOT NULL,
        size VARCHAR(50) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        completed_processes INT NOT NULL DEFAULT 0,
        defects INT NOT NULL DEFAULT 0
      );
    `;

    // 5. Table service_logs
    await sql`
      CREATE TABLE IF NOT EXISTS service_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        variation_id UUID REFERENCES service_variations(id) ON DELETE SET NULL,
        seamstress_name VARCHAR(255) NOT NULL,
        processes_count INT NOT NULL,
        variation_description VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 6. Table sewing_processes (Global catalog of sewing operations)
    await sql`
      CREATE TABLE IF NOT EXISTS sewing_processes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Seed default initial processes
    const initialProcesses = [
      'Cós',
      'Baínha',
      'Bolso',
      'Montagem Frente',
      'Montagem Fundo',
      'Junção Frente e Fundo',
    ];

    for (const procName of initialProcesses) {
      await sql`
        INSERT INTO sewing_processes (name)
        VALUES (${procName})
        ON CONFLICT (name) DO NOTHING;
      `;
    }

    // 7. Table service_selected_processes (Processes attached to a specific service batch)
    await sql`
      CREATE TABLE IF NOT EXISTS service_selected_processes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        process_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log(
      '[DatabaseService] Tabelas (users, suppliers, services, service_variations, service_logs, sewing_processes, service_selected_processes) verificadas com sucesso.'
    );
  } catch (error) {
    console.error('[DatabaseService] ERRO ao inicializar banco de dados:', error);
  }
}
