import React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import '../globals.css';

function InitialLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;

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
    return (
      <View className="flex-1 justify-center items-center bg-[#2C1435]">
        <ActivityIndicator size="large" color="#6B224F" />
      </View>
    );
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
