import * as Crypto from 'expo-crypto';
import { sql } from '../core/database';
import { UserModel } from '../models/types';

export async function hashPassword(password: string): Promise<string> {
  const salt = 'faccao_moreira_seamstress_salt_2026';
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`
  );
  return digest.toLowerCase();
}

export class UserRepository {
  /**
   * Create a new user (register)
   */
  async registerUser({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }): Promise<UserModel> {
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[UserRepository] Tentando cadastrar usuário: email=${normalizedEmail}, name=${name}`);

    try {
      const passwordHash = await hashPassword(password);

      // Check if email already exists
      const checkResult = await sql`
        SELECT id FROM users WHERE LOWER(email) = ${normalizedEmail}
      `;

      if (checkResult && checkResult.length > 0) {
        console.warn(`[UserRepository] AVISO: E-mail ${normalizedEmail} já está cadastrado.`);
        throw new Error('Este e-mail já está cadastrado.');
      }

      const result = await sql`
        INSERT INTO users (name, email, password_hash)
        VALUES (${name.trim()}, ${normalizedEmail}, ${passwordHash})
        RETURNING id, name, email, created_at
      `;

      const row = result[0];
      const user: UserModel = {
        id: row.id?.toString(),
        name: row.name as string,
        email: row.email as string,
        createdAt: row.created_at,
      };

      console.log(`[UserRepository] Usuário cadastrado com sucesso! id=${user.id}`);
      return user;
    } catch (error) {
      console.error(`[UserRepository] ERRO ao cadastrar usuário ${normalizedEmail}:`, error);
      throw error;
    }
  }

  /**
   * Authenticate user by email and password
   */
  async authenticate({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<UserModel | null> {
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[UserRepository] Autenticando usuário: email=${normalizedEmail}`);

    try {
      const passwordHash = await hashPassword(password);

      const result = await sql`
        SELECT id, name, email, created_at, password_hash
        FROM users
        WHERE LOWER(email) = ${normalizedEmail}
      `;

      if (!result || result.length === 0) {
        console.warn(`[UserRepository] AVISO: Usuário ${normalizedEmail} não encontrado.`);
        return null;
      }

      const row = result[0];
      const storedHash = row.password_hash as string;

      if (storedHash !== passwordHash) {
        console.warn(`[UserRepository] AVISO: Senha incorreta para o usuário ${normalizedEmail}.`);
        return null;
      }

      const user: UserModel = {
        id: row.id?.toString(),
        name: row.name as string,
        email: row.email as string,
        createdAt: row.created_at,
      };

      console.log(`[UserRepository] Usuário autenticado com sucesso! id=${user.id}`);
      return user;
    } catch (error) {
      console.error(`[UserRepository] ERRO durante a autenticação de ${normalizedEmail}:`, error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserModel | null> {
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[UserRepository] Buscando usuário por e-mail: ${normalizedEmail}`);

    try {
      const result = await sql`
        SELECT id, name, email, created_at
        FROM users
        WHERE LOWER(email) = ${normalizedEmail}
      `;

      if (!result || result.length === 0) {
        console.warn(`[UserRepository] Nenhum usuário encontrado para o e-mail: ${normalizedEmail}`);
        return null;
      }

      const row = result[0];
      const user: UserModel = {
        id: row.id?.toString(),
        name: row.name as string,
        email: row.email as string,
        createdAt: row.created_at,
      };

      console.log(`[UserRepository] Usuário localizado: id=${user.id}, name=${user.name}`);
      return user;
    } catch (error) {
      console.error(`[UserRepository] ERRO ao buscar usuário por e-mail ${normalizedEmail}:`, error);
      throw error;
    }
  }
}

export const userRepository = new UserRepository();
