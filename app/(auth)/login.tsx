import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithEmail, loginWithBiometrics, getSavedEmail, isLoading, isBiometricsEnabled, canCheckBiometrics } =
    useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);

  useEffect(() => {
    loadSavedEmail();
  }, []);

  const loadSavedEmail = async () => {
    const saved = await getSavedEmail();
    if (saved) {
      setEmail(saved);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Informe o e-mail e a senha.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Atenção', 'E-mail inválido.');
      return;
    }

    try {
      const success = await loginWithEmail({ email: email.trim(), password });
      if (!success) {
        Alert.alert('Erro', 'E-mail ou senha incorretos.');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao realizar login.');
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const success = await loginWithBiometrics(email.trim());
      if (!success) {
        Alert.alert('Aviso', 'Autenticação biométrica não concluída.');
      }
    } catch (error: any) {
      Alert.alert('Erro Biometria', error.message || 'Falha na biometria.');
    }
  };

  return (
    <LinearGradient colors={['#2C1435', '#4A1942', '#6B224F']} className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View className="bg-white/95 rounded-3xl p-7 shadow-xl">
            {/* Header Icon */}
            <View className="items-center mb-5">
              <View className="w-18 h-18 rounded-full bg-brand-burgundy/10 justify-center items-center mb-3">
                <Ionicons name="cut-outline" size={40} color="#6B224F" />
              </View>
              <Text className="text-2xl font-bold text-brand-plum">Facção Moreira</Text>
              <Text className="text-xs text-gray-500 mt-1">Gerenciamento para Costureiras</Text>
            </View>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-gray-700 mb-1.5">E-mail</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-3 h-12 bg-white">
                <Ionicons name="mail-outline" size={20} color="#666" className="mr-2" />
                <TextInput
                  className="flex-1 text-base text-gray-800"
                  placeholder="seu@email.com"
                  placeholderTextColor="#aaa"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-gray-700 mb-1.5">Senha</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-3 h-12 bg-white">
                <Ionicons name="lock-closed-outline" size={20} color="#666" className="mr-2" />
                <TextInput
                  className="flex-1 text-base text-gray-800"
                  placeholder="Sua senha"
                  placeholderTextColor="#aaa"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={obscurePassword}
                />
                <TouchableOpacity onPress={() => setObscurePassword(!obscurePassword)}>
                  <Ionicons name={obscurePassword ? 'eye-outline' : 'eye-off-outline'} size={22} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="bg-brand-burgundy h-12 rounded-xl justify-center items-center shadow-md mb-4"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-bold">Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Biometric Button */}
            {(isBiometricsEnabled || canCheckBiometrics) && (
              <TouchableOpacity
                onPress={handleBiometricLogin}
                disabled={isLoading}
                className="border-1.5 border-brand-burgundy h-12 rounded-xl flex-row justify-center items-center mb-5"
              >
                <Ionicons name="finger-print-outline" size={24} color="#6B224F" className="mr-2" />
                <Text className="text-brand-burgundy text-sm font-semibold">Entrar com Biometria</Text>
              </TouchableOpacity>
            )}

            {/* Register Footer */}
            <View className="flex-row justify-center mt-2">
              <Text className="text-gray-600 text-xs">Não tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text className="text-brand-burgundy font-bold text-xs">Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
