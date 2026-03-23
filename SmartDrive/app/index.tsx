import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  async function handleLogin() {
    try {
      const response = await fetch("http://192.168.1.198:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          senha,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // salva usuário e token
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('accessToken', data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);

        // redirecionar
        router.replace("/home");
      } else {
        setModalMessage("Login inválido. \n Entre em contato com um superior para restaurar a senha.");
        setModalVisible(true);
      }
    } catch (error) {
      console.log(error);
      setModalMessage("Erro ao conectar com o servidor");
      setModalVisible(true);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>SmartDrive</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitulo}>Olá, acesse sua conta!</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Senha"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
            value={senha}
            onChangeText={setSenha}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color="#94a3b8"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.botao} onPress={handleLogin}>
          <Text style={styles.botaoTexto}>Login</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Atenção</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 25,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    marginTop: -60,
  },
  titulo: {
    fontSize: 28,
    color: "#D9FF00",
    fontWeight: "bold",
    textAlign: "left",
  },
  subtitulo: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 105,
    textAlign: "left",
  },
  input: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    padding: 18,
    borderRadius: 25,
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    color: "#fff",
    paddingVertical: 18,
  },
  eyeIcon: {
    padding: 5,
  },
  botao: {
    backgroundColor: "#D9FF00",
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
  },
  botaoTexto: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 16,
  },
});