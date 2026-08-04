import React, { useState } from 'react';
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

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Atenção', 'E-mail inválido.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    try {
      const success = await register({ name: name.trim(), email: email.trim(), password });
      if (success) {
        Alert.alert('Sucesso', 'Cadastro realizado com sucesso!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Erro no Cadastro', error.message || 'Erro ao efetuar cadastro.');
    }
  };

  return (
    <LinearGradient colors={['#2C1435', '#4A1942', '#6B224F']} className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View className="bg-white/95 rounded-3xl p-7 shadow-xl">
            <View className="items-center mb-5">
              <Text className="text-xl font-bold text-brand-plum">Nova Costureira</Text>
              <Text className="text-xs text-gray-500 mt-1 text-center">
                Crie sua conta para gerenciar seus serviços
              </Text>
            </View>

            {/* Name Input */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-gray-700 mb-1.5">Nome Completo</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-3 h-12 bg-white">
                <Ionicons name="person-outline" size={20} color="#666" className="mr-2" />
                <TextInput
                  className="flex-1 text-base text-gray-800"
                  placeholder="Seu nome"
                  placeholderTextColor="#aaa"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
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
            <View className="mb-4">
              <Text className="text-xs font-semibold text-gray-700 mb-1.5">Senha</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-3 h-12 bg-white">
                <Ionicons name="lock-closed-outline" size={20} color="#666" className="mr-2" />
                <TextInput
                  className="flex-1 text-base text-gray-800"
                  placeholder="Mínimo 6 caracteres"
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

            {/* Confirm Password Input */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-gray-700 mb-1.5">Confirmar Senha</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-3 h-12 bg-white">
                <Ionicons name="lock-closed-outline" size={20} color="#666" className="mr-2" />
                <TextInput
                  className="flex-1 text-base text-gray-800"
                  placeholder="Repita a senha"
                  placeholderTextColor="#aaa"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={obscurePassword}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              className="bg-brand-burgundy h-12 rounded-xl justify-center items-center shadow-md"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-bold">Cadastrar</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
