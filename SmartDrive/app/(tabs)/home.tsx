import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Image } from "react-native";
import { useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "@/components/Header";
import { API_URL } from "@/constants/api";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';

export default function Home() {
  const [velocidade, setVelocidade] = useState(27);
  const [nome, setNome] = useState("Usuário");

  //permissão da câmera
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [carregandoCaptura, setCarregandoCaptura] = useState(false);

  const [placaLida, setPlacaLida] = useState("Aguardando...");
  const [statusLeitura, setStatusLeitura] = useState("Aguardando detecção");
  const [proprietario, setProprietario] = useState("");
  
  //histórico últimas 5 placas
  const [historicoPlacas, setHistoricoPlacas] = useState<any[]>([]);

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

  async function abrirCameraFullscreen() {
    setModalVisible(true);
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
  }

  async function fecharCameraFullscreen() {
    setModalVisible(false);
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }

  async function simularCapturaEProcessamento() {
    if (carregandoCaptura) return;

    setCarregandoCaptura(true);
    setModalVisible(false); 
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const dadosSimulados1 = {
        placa: "XYZ4321",
        status: "Cadastrada",
        proprietario: "Carlos Alberto"
    };

    // Exemplo 2: 
    /*
    const dadosSimulados2 = {
        placa: "ABC1234",
        status: "Não Cadastrada",
        proprietario: ""
    };
    */

    const dados = dadosSimulados1;
    setPlacaLida(dados.placa);
    setStatusLeitura(dados.status);
    setProprietario(dados.proprietario);

    setHistoricoPlacas(prev => {
        const novaLeitura = {
            id: String(Date.now()), 
            placa: dados.placa,
            velocidade: 27,
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        const novoHistorico = [novaLeitura, ...prev];
        return novoHistorico.slice(0, 5); 
    });

    setCarregandoCaptura(false);
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

          {statusLeitura === 'Cadastrada' && proprietario && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Proprietário:</Text>
                <Text style={styles.infoValue}>{proprietario}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.card}>
           <Text style={styles.cardTitle}>Últimas Leituras (5)</Text>
           
           {carregandoCaptura ? (
             <ActivityIndicator color="#D9FF00" style={{ padding: 20 }} />
           ) : historicoPlacas.length > 0 ? (
             historicoPlacas.map((item, index) => (
                <View key={item.id}>
                    <View style={styles.historyItem}>
                        <Text style={styles.historyText}>
                            {item.placa}  -  {item.velocidade} km/h
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

          <TouchableOpacity style={styles.capturaBtn} onPress={simularCapturaEProcessamento}>
            <Text style={styles.capturaBtnTexto}>Capturar Placa</Text>
          </TouchableOpacity>
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
});