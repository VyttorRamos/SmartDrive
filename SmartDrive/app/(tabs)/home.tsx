import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, TextInput, Platform } from "react-native";
import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "@/components/Header";
import { API_URL } from "@/constants/api";
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from '@react-navigation/native';

export default function Home() {
  const [velocidade, setVelocidade] = useState(27);
  const [nome, setNome] = useState("Usuário");
  
  //ip do arduino
  const [ipArduino, setIpArduino] = useState("172.20.10.9");

  const [modalVisible, setModalVisible] = useState(false);
  const [carregandoCaptura, setCarregandoCaptura] = useState(false);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);

  const [placaLida, setPlacaLida] = useState("Aguardando...");
  const [statusLeitura, setStatusLeitura] = useState("Aguardando detecção");
  const [proprietario, setProprietario] = useState("");
  
  const [historicoPlacas, setHistoricoPlacas] = useState<any[]>([]);

  const [avisoVisible, setAvisoVisible] = useState(false);
  const [avisoTitle, setAvisoTitle] = useState("");
  const [avisoMessage, setAvisoMessage] = useState("");

  function mostrarAviso(titulo: string, mensagem: string) {
    setAvisoTitle(titulo);
    setAvisoMessage(mensagem);
    setAvisoVisible(true);
  }

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

  useFocusEffect(
    useCallback(() => {
      fetchUltimasLeituras();
    }, [])
  );

  async function fetchUltimasLeituras() {
    setCarregandoHistorico(true);
    try {
      const response = await fetch(`${API_URL}/infracoes`);
      const data = await response.json();
      
      const ultimas5 = data.slice(0, 5).map((inf: any) => {
        const d = new Date(inf.data_hora);
        const horaStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return {
          id: String(inf.id),
          placa: inf.placa,
          velocidade: inf.velocidade,
          hora: horaStr !== 'Invalid Date' ? horaStr : ''
        };
      });
      
      setHistoricoPlacas(ultimas5);
    } catch (error) {
      console.log("Erro ao buscar últimas leituras:", error);
    } finally {
      setCarregandoHistorico(false);
    }
  }

  const acimaLimite = velocidade > 20;

  async function capturarEEnviarImagem() {
    if (carregandoCaptura) return;
    setCarregandoCaptura(true);

    try {
      const espUrl = `http://${ipArduino}/capture`;
      const formData = new FormData();
      formData.append('velocidade', String(velocidade));

      if (Platform.OS === 'web') {
        const imageResponse = await fetch(espUrl);
        const imageBlob = await imageResponse.blob();
        formData.append('imagem', imageBlob, 'placa_arduino.jpg');
      } 
      else {
        const localUri = FileSystem.cacheDirectory + 'placa_arduino.jpg';
        const { uri, status } = await FileSystem.downloadAsync(espUrl, localUri);

        if (status !== 200) {
          throw new Error("Não foi possível acessar a câmera. Verifique o IP.");
        }

        formData.append('imagem', {
          uri: uri,
          name: 'placa_arduino.jpg',
          type: 'image/jpeg'
        } as any);
      }

      setModalVisible(false);

      const response = await fetch(`${API_URL}/reconhecer-placa`, {
        method: 'POST',
        body: formData
      });

      const dados = await response.json();

      if (dados.success) {
        setPlacaLida(dados.placa);
        setStatusLeitura(dados.status);
        setProprietario(dados.proprietario || "");
        fetchUltimasLeituras();
      } else {
        mostrarAviso("Aviso", dados.message || "Não foi possível ler a placa.");
      }

    } catch (error) {
      console.log("Erro:", error);
      mostrarAviso("Erro de Conexão", "Falha ao comunicar com o Arduino ou Servidor. Verifique a rede.");
    } finally {
      setCarregandoCaptura(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Header />
      
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Text style={styles.greeting}>Olá, {nome}</Text>
        </View>

        <View style={styles.cardArduino}>
            <Text style={styles.labelArduino}>IP do Sensor / Câmera (Arduino):</Text>
            <View style={styles.inputIpContainer}>
                <Ionicons name="wifi" size={20} color="#D9FF00" style={{ marginRight: 10 }} />
                <TextInput 
                    style={styles.inputIp}
                    value={ipArduino}
                    onChangeText={setIpArduino}
                    keyboardType="numeric"
                    placeholder="Ex: 192.168.1.100"
                    placeholderTextColor="#555"
                />
            </View>
            
            <TouchableOpacity style={styles.btnCapturaArduino} onPress={capturarEEnviarImagem}>
                {carregandoCaptura ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <>
                        <Ionicons name="camera" size={20} color="#000" style={{ marginRight: 8 }} />
                        <Text style={styles.btnCapturaTexto}>Ler Placa via Sensor</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Placa Lida:</Text>
            <Text style={styles.infoValue}>{placaLida}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Velocidade:</Text>
            <Text style={styles.infoValue}>{velocidade} km/h</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, { color: statusLeitura === 'Não Cadastrada' ? '#ff4444' : '#fff' }]}>
                {statusLeitura}
            </Text>
          </View>

          {statusLeitura === 'Cadastrada' && proprietario ? (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Proprietário:</Text>
                <Text style={styles.infoValue}>{proprietario}</Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.card}>
           <Text style={styles.cardTitle}>Últimas Leituras (5)</Text>
           
           {carregandoCaptura || carregandoHistorico ? (
             <ActivityIndicator color="#D9FF00" style={{ padding: 20 }} />
           ) : historicoPlacas.length > 0 ? (
             historicoPlacas.map((item, index) => (
                <View key={item.id}>
                    <View style={styles.historyItem}>
                        <Text style={styles.historyText}>
                            {item.placa || 'Sem Placa'}  -  {item.velocidade} km/h
                        </Text>
                        <Text style={styles.historyTime}>{item.hora}</Text>
                    </View>
                    {index < historicoPlacas.length - 1 && <View style={styles.divider} />}
                </View>
             ))
           ) : (
             <Text style={styles.semHistoricoText}>Nenhuma placa lida recentemente.</Text>
           )}
        </View>
      </ScrollView>

      <Modal visible={avisoVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentAviso}>
            <Text style={styles.modalTitleAviso}>{avisoTitle}</Text>
            <Text style={styles.avisoMessageText}>{avisoMessage}</Text>
            <TouchableOpacity style={styles.avisoOkBtn} onPress={() => setAvisoVisible(false)}>
              <Text style={styles.avisoOkText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  greeting: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  cardArduino: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },

  labelArduino: {
    color: "#888",
    fontSize: 14,
    marginBottom: 10,
  },

  inputIpContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
  },

  inputIp: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },

  btnCapturaArduino: {
    backgroundColor: "#D9FF00",
    paddingVertical: 15,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  btnCapturaTexto: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },

  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    marginBottom: 20,
    paddingVertical: 10,
  },

  cardTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  infoLabel: {
    color: "#aaa",
    fontSize: 16,
    width: 110,
  },

  infoValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  divider: {
    height: 1,
    backgroundColor: "#333",
    marginHorizontal: 20,
  },

  historyItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  historyText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },

  historyTime: {
    color: "#888",
    fontSize: 12,
  },

  semHistoricoText: {
    color: "#888",
    textAlign: "center",
    padding: 20,
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContentAviso: {
    width: "85%",
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },

  modalTitleAviso: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },

  avisoMessageText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },

  avisoOkBtn: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },

  avisoOkText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});