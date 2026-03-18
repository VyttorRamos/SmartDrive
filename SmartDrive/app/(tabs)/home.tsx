import { View, Text, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Header from "@/components/Header";

export default function Home() {
  const [velocidade, setVelocidade] = useState(0);

  // Simula velocidade
  useEffect(() => {
    async function checkUser() {
      const user = await AsyncStorage.getItem("user");

      if (!user) {
        router.replace("/");
      }
    }

    checkUser();
    const interval = setInterval(() => {
      const novaVelocidade = Math.floor(Math.random() * 40);
      setVelocidade(novaVelocidade);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const acimaLimite = velocidade > 20;

  return (
    <View style={styles.screen}>
      <Header />
      <View style={styles.container}>
        <Text style={styles.titulo}>Acompanhar Velocidade</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Velocidade Atual</Text>

          <Text
            style={[
              styles.velocidade,
              acimaLimite && styles.velocidadeAlerta,
            ]}
          >
            {velocidade} km/h
          </Text>

          {acimaLimite && (
            <View style={styles.alertaBox}>
              <Text style={styles.alertaTexto}>Reduza a velocidade</Text>
              <Text style={styles.alertaSub}>
                Limite permitido: 20 km/h
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  titulo: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#1e1e1e",
    padding: 25,
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
  },
  label: {
    color: "#94a3b8",
    fontSize: 16,
    marginBottom: 10,
  },
  velocidade: {
    fontSize: 48,
    color: "#ffffff",
    fontWeight: "bold",
  },
  velocidadeAlerta: {
    color: "#ffffff",
  },
  alertaBox: {
    marginTop: 20,
    backgroundColor: "#000000",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  alertaTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  alertaSub: {
    color: "#ffffff",
    fontSize: 14,
    marginTop: 5,
  },
});