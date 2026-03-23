import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "@/components/Header";
import { API_URL } from "@/constants/api"; //${API_URL}

export default function Home() {
  const [velocidade, setVelocidade] = useState(27);
  const [nome, setNome] = useState("Usuário");

  useEffect(() => {
    async function checkUser() {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setNome(user.nome);
      }
    }
    checkUser();
  }, []);

  const acimaLimite = velocidade > 20;

  return (
    <View style={styles.screen}>
      <Header />
      
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.top}>
          <Text style={styles.greeting}>Olá, {nome}</Text>
        </View>


        <View style={styles.cameraBox}>
          <Image
            source={{ uri: "https://imgur.com/gallery/after-long-winter-93-crown-victoria-got-her-first-hand-wash-of-2026-n96l871" }}
            style={styles.camera}
          />

          <View style={styles.cameraOverlay}>
             <Text style={styles.cameraTexto}>Câmera ao vivo</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Placa:</Text>
            <Text style={styles.infoValue}>XYZ4321</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Velocidade:</Text>
            <Text style={styles.infoValue}>{velocidade} km/h</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={styles.infoValue}>{acimaLimite ? "Infração" : "OK"}</Text>
          </View>
        </View>

        <View style={styles.card}>
           <View style={styles.historyItem}>
             <Text style={styles.historyText}>XYZ4321  -  27 km/h</Text>
           </View>
           <View style={styles.divider} />
           
           <View style={styles.historyItem}>
             <Text style={styles.historyText}>DEF1234  -  23 km/h</Text>
           </View>
           <View style={styles.divider} />
           
           <View style={styles.historyItem}>
             <Text style={styles.historyText}>GHI1234  -  19 km/h</Text>
           </View>
           <View style={styles.divider} />
           
           <View style={styles.historyItem}>
             <Text style={styles.historyText}>JKL1234  -  20 km/h</Text>
           </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 120,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    color: "#fff",
    fontSize: 22,
    fontWeight: 'bold',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  cameraBox: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#D9FF00",
    marginBottom: 20,
    position: 'relative',
  },
  camera: {
    height: 200, 
    width: '100%',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(150, 180, 0, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  cameraTexto: {
    color: "#fff",
    fontStyle: 'italic',
    textAlign: 'right',
    fontWeight: '500',
  },
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    marginBottom: 20,
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  infoLabel: {
    color: "#aaa",
    fontSize: 16,
    width: 100,
  },
  infoValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 20,
  },
  historyItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  historyText: {
    color: "#fff",
    fontSize: 15,
  },
});