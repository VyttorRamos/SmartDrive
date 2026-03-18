import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function handleLogin() {
    const response = await fetch("http://192.168.56.1:3000/login", {
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
      router.replace("/home");
    } else {
      alert("Login inválido");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>SmartDrive</Text>
      <Text style={styles.subtitulo}>Acesse sua conta</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Senha"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        style={styles.input}
        value={senha}
        onChangeText={setSenha}
      />

      <TouchableOpacity style={styles.botao} onPress={handleLogin}>
        <Text style={styles.botaoTexto}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    padding: 20,
  },
  titulo: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitulo: {
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#1e293b",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  botao: {
    backgroundColor: "#22c55e",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  botaoTexto: {
    color: "#fff",
    fontWeight: "bold",
  },
});