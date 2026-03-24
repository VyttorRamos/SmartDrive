import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import { useEffect, useState, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "@/components/Header";
import { API_URL } from "@/constants/api";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from '@react-navigation/native';

export default function Home() {
  const [velocidade, setVelocidade] = useState(27);
  const [nome, setNome] = useState("Usuário");

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

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

  async function abrirCameraFullscreen() {
    setModalVisible(true);
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
  }

  async function fecharCameraFullscreen() {
    setModalVisible(false);
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }

  async function capturarEEnviarImagem() {
    if (!cameraRef.current || carregandoCaptura) return;

    setCarregandoCaptura(true);

    try {
      const foto = await cameraRef.current.takePictureAsync({ quality: 0.5 });

      setModalVisible(false);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

      if (!foto || !foto.uri) throw new Error("Falha ao capturar imagem");

      const formData = new FormData();
      formData.append('imagem', {
        uri: foto.uri,
        name: 'placa_capturada.jpg',
        type: 'image/jpeg'
      } as any);
      
      formData.append('velocidade', String(velocidade));

      const response = await fetch(`${API_URL}/reconhecer-placa`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
      mostrarAviso("Erro", "Falha de conexão com o servidor.");
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } finally {
      setCarregandoCaptura(false);
    }
  }

  if (!permission) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <Header />
      
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Text style={styles.greeting}>Olá, {nome}</Text>
        </View>

        <TouchableOpacity style={styles.cameraBox} onPress={abrirCameraFullscreen}>
          
          {!permission.granted ? (
            <View style={styles.permissaoContainer}>
              <Text style={styles.permissaoTexto}>Precisamos de acesso à câmera.</Text>
              <TouchableOpacity style={styles.permissaoBtn} onPress={requestPermission}>
                <Text style={styles.permissaoBtnTexto}>Conceder Permissão</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <CameraView 
              style={styles.camera} 
              facing="back" 
            />
          )}

          <View style={styles.cameraOverlay}>
             <Ionicons name="expand-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
             <Text style={styles.cameraTexto}>Toque para tela cheia</Text>
          </View>
        </TouchableOpacity>

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

      <Modal visible={modalVisible} transparent={false} animationType="slide">
        <View style={styles.modalFullscreen}>
          <CameraView 
            style={styles.cameraFullscreen} 
            facing="back"
            ref={cameraRef}
          />
          
          <TouchableOpacity style={styles.fecharModalBtn} onPress={fecharCameraFullscreen}>
            <Ionicons name="close-outline" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.capturaBtn} onPress={capturarEEnviarImagem}>
            <Text style={styles.capturaBtnTexto}>
              {carregandoCaptura ? "Processando..." : "Capturar Placa"}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

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
  cameraBox: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#D9FF00",
    marginBottom: 20,
    position: 'relative',
    backgroundColor: '#111',
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraTexto: {
    color: "#fff",
    fontStyle: 'italic',
    fontWeight: '500',
    flex: 1,
  },
  permissaoContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissaoTexto: {
    color: '#888',
    textAlign: 'center',
    marginBottom: 15,
  },
  permissaoBtn: {
    backgroundColor: '#D9FF00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  permissaoBtnTexto: {
    color: '#000',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    marginBottom: 20,
    paddingVertical: 10,
  },
  cardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    paddingHorizontal: 20,
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
    width: 110,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: 'bold',
  },
  historyTime: {
    color: '#888',
    fontSize: 12,
  },
  semHistoricoText: {
    color: '#888',
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
  modalFullscreen: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  cameraFullscreen: {
    flex: 1,
  },
  fecharModalBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 25,
  },
  capturaBtn: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#D9FF00',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
  },
  capturaBtnTexto: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentAviso: {
    width: '85%',
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  modalTitleAviso: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  avisoMessageText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  avisoOkBtn: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  avisoOkText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});