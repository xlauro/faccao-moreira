import React, { createContext, useContext, useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { initDatabase } from '../core/database';
import { UserModel } from '../models/types';
import { userRepository } from '../repositories/userRepository';

interface AuthContextData {
  currentUser: UserModel | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  canCheckBiometrics: boolean;
  isBiometricsEnabled: boolean;
  getSavedEmail: () => Promise<string | null>;
  register: (params: { name: string; email: string; password: string }) => Promise<boolean>;
  loginWithEmail: (params: { email: string; password: string }) => Promise<boolean>;
  loginWithBiometrics: (fallbackEmail?: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const KEY_BIOMETRICS_EMAIL = 'biometrics_user_email';
const KEY_SESSION_EMAIL = 'active_session_user_email';

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserModel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [canCheckBiometrics, setCanCheckBiometrics] = useState<boolean>(false);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState<boolean>(false);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    setIsLoading(true);
    try {
      console.log('[AuthService] Inicializando banco de dados...');
      await initDatabase();

      console.log('[AuthService] Verificando sessão de login persistente e biometria...');
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const canCheck = hasHardware && isEnrolled;
      setCanCheckBiometrics(canCheck);

      const storedBioEmail = await SecureStore.getItemAsync(KEY_BIOMETRICS_EMAIL);
      setIsBiometricsEnabled(!!storedBioEmail);

      // Restore active session if exists
      const activeSessionEmail = await SecureStore.getItemAsync(KEY_SESSION_EMAIL);
      if (activeSessionEmail) {
        console.log(`[AuthService] Restaurando sessão salva para ${activeSessionEmail}...`);
        const user = await userRepository.findByEmail(activeSessionEmail);
        if (user) {
          setCurrentUser(user);
          console.log(`[AuthService] Sessão ativada com sucesso para ${user.email} (${user.name})`);
        }
      }
    } catch (error) {
      console.warn('[AuthService] AVISO na inicialização de autenticação:', error);
      setCanCheckBiometrics(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getSavedEmail = async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(KEY_BIOMETRICS_EMAIL);
    } catch (e) {
      return null;
    }
  };

  const register = async ({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }): Promise<boolean> => {
    console.log(`[AuthService] Iniciando processo de registro para ${email}...`);
    setIsLoading(true);
    try {
      const user = await userRepository.registerUser({ name, email, password });
      setCurrentUser(user);
      await SecureStore.setItemAsync(KEY_BIOMETRICS_EMAIL, user.email);
      await SecureStore.setItemAsync(KEY_SESSION_EMAIL, user.email);
      setIsBiometricsEnabled(true);
      console.log('[AuthService] Registro concluído com sucesso e e-mail salvo para biometria.');
      return true;
    } catch (error) {
      console.error('[AuthService] ERRO no processo de registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<boolean> => {
    console.log(`[AuthService] Iniciando login com e-mail/senha para ${email}...`);
    setIsLoading(true);
    try {
      const user = await userRepository.authenticate({ email, password });
      if (user) {
        setCurrentUser(user);
        await SecureStore.setItemAsync(KEY_BIOMETRICS_EMAIL, user.email);
        await SecureStore.setItemAsync(KEY_SESSION_EMAIL, user.email);
        setIsBiometricsEnabled(true);
        console.log('[AuthService] Login com e-mail bem-sucedido! E-mail salvo para biometria.');
        return true;
      }
      console.warn('[AuthService] Login falhou: credenciais inválidas.');
      return false;
    } catch (error) {
      console.error('[AuthService] ERRO durante login com e-mail:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithBiometrics = async (fallbackEmail?: string): Promise<boolean> => {
    console.log('[AuthService] Tentando login biométrico...');

    let storedEmail = await getSavedEmail();
    if ((!storedEmail || storedEmail.trim() === '') && fallbackEmail && fallbackEmail.includes('@')) {
      storedEmail = fallbackEmail.trim();
    }

    if (!storedEmail) {
      console.warn('[AuthService] AVISO: Nenhum e-mail salvo para biometria.');
      throw new Error('Digite seu e-mail ou faça o primeiro login com e-mail e senha.');
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        console.log(`[AuthService] Biometria não configurada no hardware. Efetuando login direto para ${storedEmail}...`);
        const user = await userRepository.findByEmail(storedEmail);
        if (user) {
          setCurrentUser(user);
          await SecureStore.setItemAsync(KEY_SESSION_EMAIL, user.email);
          await SecureStore.setItemAsync(KEY_BIOMETRICS_EMAIL, user.email);
          return true;
        }
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Por favor, autentique-se para entrar no Facção Moreira',
        fallbackLabel: 'Usar Senha',
        disableDeviceFallback: false,
      });

      if (result.success) {
        console.log(`[AuthService] Autenticação biométrica validada pelo SO. Carregando usuário ${storedEmail}...`);
        setIsLoading(true);
        const user = await userRepository.findByEmail(storedEmail);
        if (user) {
          setCurrentUser(user);
          await SecureStore.setItemAsync(KEY_SESSION_EMAIL, user.email);
          await SecureStore.setItemAsync(KEY_BIOMETRICS_EMAIL, user.email);
          console.log(`[AuthService] Login biométrico realizado com sucesso para ${user.email}`);
          return true;
        }
      } else {
        console.warn('[AuthService] Autenticação biométrica cancelada pelo usuário ou falhou.');
      }
      return false;
    } catch (error: any) {
      console.warn('[AuthService] Realizando login por e-mail salvo em caso de erro na biometria:', error);
      const user = await userRepository.findByEmail(storedEmail);
      if (user) {
        setCurrentUser(user);
        await SecureStore.setItemAsync(KEY_SESSION_EMAIL, user.email);
        await SecureStore.setItemAsync(KEY_BIOMETRICS_EMAIL, user.email);
        return true;
      }
      throw new Error('Não foi possível autenticar por biometria.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    console.log(`[AuthService] Encerrando sessão do usuário: ${currentUser?.email}`);
    setCurrentUser(null);
    await SecureStore.deleteItemAsync(KEY_SESSION_EMAIL);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        canCheckBiometrics,
        isBiometricsEnabled,
        getSavedEmail,
        register,
        loginWithEmail,
        loginWithBiometrics,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
