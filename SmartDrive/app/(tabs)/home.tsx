import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, TextInput, Platform, Image } from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "@/components/Header";
import { API_URL } from "@/constants/api";
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from '@react-navigation/native';

export default function Home() {
  const [velocidade, setVelocidade] = useState(0);
  const [nome, setNome] = useState("Usuário");

  // IPs dos 3 hardwares
  const [ipCamera, setIpCamera] = useState("...");
  const [ipSensorEntrada, setIpSensorEntrada] = useState("...");
  const [ipSensorSaida, setIpSensorSaida] = useState("...");

  const tempoEntradaRef = useRef<number | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [carregandoCaptura, setCarregandoCaptura] = useState(false);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);

  const [previewKey, setPreviewKey] = useState(Date.now());
  const [isStreaming, setIsStreaming] = useState(true);

  const [placaLida, setPlacaLida] = useState("Aguardando...");
  const [statusLeitura, setStatusLeitura] = useState("Aguardando detecção");
  const [proprietario, setProprietario] = useState("");

  const [historicoPlacas, setHistoricoPlacas] = useState<any[]>([]);

  const [avisoVisible, setAvisoVisible] = useState(false);
  const [avisoTitle, setAvisoTitle] = useState("");
  const [avisoMessage, setAvisoMessage] = useState("");

  const [expandirConfig, setExpandirConfig] = useState(false);

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

  // --- LÓGICA DE STREAMING MAIS RÁPIDO (200ms) ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isStreaming && ipCamera && !carregandoCaptura) {
      // 500ms é o "ponto doce" para o ESP32-CAM via Wi-Fi de celular.
      // Dá tempo de baixar a imagem inteira antes de pedir a próxima.
      interval = setInterval(() => {
        setPreviewKey(Date.now());
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isStreaming, ipCamera, carregandoCaptura]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (ipSensorEntrada && ipSensorSaida && !carregandoCaptura) {
      interval = setInterval(async () => {

        try {
          const resEntrada = await fetch(`http://${ipSensorEntrada}/status`, {
            headers: { 'Cache-Control': 'no-store', 'Pragma': 'no-cache' }
          });
          const dataEntrada = await resEntrada.json();

          if (dataEntrada.detectado === true && tempoEntradaRef.current === null) {
            console.log("CARRO ENTROU - Iniciando cronômetro");
            tempoEntradaRef.current = Date.now();
          }
        } catch (error) { }

        try {
          const resSaida = await fetch(`http://${ipSensorSaida}/status`, {
            headers: { 'Cache-Control': 'no-store', 'Pragma': 'no-cache' }
          });
          const dataSaida = await resSaida.json();

          const cortouLaserSaida = dataSaida.detectado === true || dataSaida.saida === true;

          if (cortouLaserSaida && tempoEntradaRef.current !== null) {
            console.log("CARRO SAIU - Calculando velocidade");
            let velCalculada = 0;

            const tempoSaida = Date.now();
            const deltaTSegundos = (tempoSaida - tempoEntradaRef.current) / 1000;

            // 8 cm de distância entre os LEDs
            const distanciaMetros = 0.08;

            // Fator de escala do carrinho (Ajuste aqui! 35 é um ótimo meio-termo)
            // Se estiver batendo mais de 20 km/h muito fácil, diminua para 20.
            // Se estiver difícil passar de 20 km/h, aumente para 50.
            const FATOR_ESCALA = 35;

            // Cálculo: (Espaço / Tempo) * 3.6 para converter m/s em km/h
            const velFisicaKmH = (distanciaMetros / deltaTSegundos) * 3.6;

            // Multiplicando a velocidade real do carrinho pela escala do projeto
            const velSimulada = velFisicaKmH * FATOR_ESCALA;

            velCalculada = parseFloat(velSimulada.toFixed(2));

            console.log(`Tempo: ${deltaTSegundos}s | Vel. Simulada: ${velCalculada} km/h`);

            tempoEntradaRef.current = null;

            setVelocidade(velCalculada);
            capturarEEnviarImagem(velCalculada);
          }
        } catch (error) { }

      }, 200);
    }

    return () => clearInterval(interval);
  }, [ipSensorEntrada, ipSensorSaida, carregandoCaptura]);

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

  async function capturarEEnviarImagem(velRegistrada: number = velocidade) {
    if (carregandoCaptura) return;

    setCarregandoCaptura(true);
    setIsStreaming(false);
    tempoEntradaRef.current = null;

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const espUrl = `http://${ipCamera}/capture?t=${Date.now()}`;
      const formData = new FormData();
      formData.append('velocidade', String(velRegistrada));

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
      mostrarAviso("Erro de Conexão", "Falha ao comunicar com os Arduinos ou Servidor.");
    } finally {
      setCarregandoCaptura(false);
      setIsStreaming(true);
    }
  }

  return (
    <View style={styles.screen}>
      <Header />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Text style={styles.greeting}>Olá, {nome}</Text>
        </View>

        <View style={styles.cameraBox}>
          {ipCamera && isStreaming ? (
            <Image
              source={{ uri: `http://${ipCamera}/capture?t=${previewKey}` }}
              style={styles.camera}
              resizeMode="cover"
              fadeDuration={0}
            />
          ) : (
            <View style={styles.permissaoContainer}>
              <ActivityIndicator color="#D9FF00" size="large" />
              <Text style={[styles.permissaoTexto, { marginTop: 10 }]}>
                {carregandoCaptura ? "Processando Placa (IA)..." : "Conectando Câmera..."}
              </Text>
            </View>
          )}

          <View style={styles.cameraOverlay}>
            <Ionicons name="hardware-chip-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.cameraTexto}>Câmera do Arduino (Ao Vivo)</Text>
          </View>
        </View>

        <View style={styles.cardArduino}>
          <TouchableOpacity
            style={styles.headerConfig}
            onPress={() => setExpandirConfig(!expandirConfig)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="construct-outline" size={20} color="#D9FF00" style={{ marginRight: 10 }} />
              <Text style={styles.tituloConfig}>Configurações e IPs</Text>
            </View>
            <Ionicons
              name={expandirConfig ? "chevron-up" : "chevron-down"}
              size={24}
              color="#D9FF00"
            />
          </TouchableOpacity>

          {expandirConfig && (
            <View style={styles.bodyConfig}>
              <Text style={styles.labelArduino}>IP da Câmera (ESP32-CAM):</Text>
              <View style={styles.inputIpContainer}>
                <Ionicons name="videocam" size={20} color="#D9FF00" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.inputIp}
                  value={ipCamera}
                  onChangeText={setIpCamera}
                  keyboardType="numeric"
                  placeholder="Ex: 192.168.1.100"
                  placeholderTextColor="#555"
                />
              </View>

              <Text style={styles.labelArduino}>IP do Sensor ENTRADA (Laser):</Text>
              <View style={styles.inputIpContainer}>
                <Ionicons name="flash" size={20} color="#D9FF00" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.inputIp}
                  value={ipSensorEntrada}
                  onChangeText={setIpSensorEntrada}
                  keyboardType="numeric"
                  placeholder="Ex: 192.168.1.101"
                  placeholderTextColor="#555"
                />
              </View>

              <Text style={styles.labelArduino}>IP do Sensor SAÍDA (Laser):</Text>
              <View style={styles.inputIpContainer}>
                <Ionicons name="exit-outline" size={20} color="#D9FF00" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.inputIp}
                  value={ipSensorSaida}
                  onChangeText={setIpSensorSaida}
                  keyboardType="numeric"
                  placeholder="Ex: 192.168.1.102"
                  placeholderTextColor="#555"
                />
              </View>

              <TouchableOpacity style={styles.btnCapturaArduino} onPress={() => capturarEEnviarImagem()}>
                {carregandoCaptura ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="camera" size={20} color="#000" style={{ marginRight: 8 }} />
                    <Text style={styles.btnCapturaTexto}>Forçar Leitura Manual</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
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

          {carregandoHistorico ? (
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

  cameraBox: {
    backgroundColor: "#111",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#D9FF00",
    marginBottom: 20,
    position: "relative",
  },

  camera: {
    height: 220,
    width: "100%",
  },

  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  cameraTexto: {
    color: "#fff",
    fontStyle: "italic",
    fontWeight: "500",
    flex: 1,
  },

  permissaoContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  permissaoTexto: {
    color: "#888",
    textAlign: "center",
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
  headerConfig: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tituloConfig: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  bodyConfig: {
    marginTop: 20,
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