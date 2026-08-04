import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { SplashScreenView } from '../src/components/common/SplashScreenView';
import '../globals.css';

// Previnir ocultamento automatico da splash nativa ate que o app esteja pronto
SplashScreen.preventAutoHideAsync().catch(() => {});

function InitialLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Ocultar a splash nativa assim que os dados terminarem de carregar
    SplashScreen.hideAsync().catch(() => {});

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login screen if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return <SplashScreenView message="Carregando dados da facção..." />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2C1435' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitle: 'Voltar',
      }}
    >
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ headerTitle: 'Cadastro de Costureira' }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="create-service" options={{ headerTitle: 'Novo Lote de Serviço' }} />
      <Stack.Screen name="edit-service" options={{ headerTitle: 'Editar Lote de Serviço' }} />
      <Stack.Screen name="start-service" options={{ headerTitle: 'Apontar Processos' }} />
      <Stack.Screen name="suppliers" options={{ headerTitle: 'Gerenciar Fornecedores' }} />
      <Stack.Screen name="completed-services" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
