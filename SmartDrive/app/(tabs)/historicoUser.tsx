import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from "react-native";
import { useState, useCallback } from "react";
import Header from "@/components/Header";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL } from "@/constants/api";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";

type Infracao = {
  id: number;
  placa: string;
  velocidade: number;
  status: string;
  data_hora: string; 
  usuario_id: number;
};

export default function MeuHistorico() {
  const [historico, setHistorico] = useState<Infracao[]>([]);
  const [historicoFiltrado, setHistoricoFiltrado] = useState<Infracao[]>([]);
  
  const [modalFiltroVisible, setModalFiltroVisible] = useState(false);
  const [dataFiltro, setDataFiltro] = useState("");

  const [dateObj, setDateObj] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [modalAvisoVisible, setModalAvisoVisible] = useState(false);
  const [modalAvisoTitle, setModalAvisoTitle] = useState("");
  const [modalAvisoMessage, setModalAvisoMessage] = useState("");

  const [stats, setStats] = useState({ passagens: 0, infracoes: 0, media: 0 });

  useFocusEffect(
    useCallback(() => {
      fetchMeuHistorico();
    }, [])
  );

  function mostrarAviso(titulo: string, mensagem: string) {
    setModalAvisoTitle(titulo);
    setModalAvisoMessage(mensagem);
    setModalAvisoVisible(true);
  }

  async function fetchMeuHistorico() {
    try {
      // Pega o usuário logado no momento
      const userData = await AsyncStorage.getItem("user");
      if (!userData) return;
      const parsedUser = JSON.parse(userData);

      const response = await fetch(`${API_URL}/infracoes`);
      const data = await response.json();
      
      // Filtra para mostrar APENAS o histórico do usuário logado
      const minhasPassagens = data.filter((item: Infracao) => item.usuario_id === parsedUser.id);
      
      setHistorico(minhasPassagens);
      setHistoricoFiltrado(minhasPassagens);
      calcularEstatisticas(minhasPassagens);
    } catch (error) {
      console.log("Erro ao buscar histórico:", error);
      mostrarAviso("Erro de Conexão", "Não foi possível carregar o seu histórico.");
    }
  }

  function calcularEstatisticas(dados: Infracao[]) {
    if (dados.length === 0) {
      setStats({ passagens: 0, infracoes: 0, media: 0 });
      return;
    }

    const totalPassagens = dados.length;
    const totalInfracoes = dados.filter(item => item.velocidade > 20 || item.status === 'Infração').length;
    const somaVelocidade = dados.reduce((acc, item) => acc + Number(item.velocidade), 0);
    const mediaVelocidade = Math.round(somaVelocidade / totalPassagens);

    setStats({ passagens: totalPassagens, infracoes: totalInfracoes, media: mediaVelocidade });
  }

  function formatarDataSegura(dataBanco: string) {
    if (!dataBanco) return 'Data não informada';
    try {
      const apenasDataHora = dataBanco.replace('T', ' ').split('.')[0];
      const [data, hora] = apenasDataHora.split(' ');
      
      if (data && hora) {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano} ${hora.substring(0, 5)}`; 
      }
      return dataBanco;
    } catch (e) {
      return dataBanco; 
    }
  }

  function aplicarFiltroData() {
    if (!dataFiltro) {
      limparFiltro();
      return;
    }

    const filtrados = historico.filter(item => {
      const dataFormatada = formatarDataSegura(item.data_hora);
      return dataFormatada.includes(dataFiltro);
    });

    setHistoricoFiltrado(filtrados);
    calcularEstatisticas(filtrados);
    setModalFiltroVisible(false);
  }

  function limparFiltro() {
    setDataFiltro('');
    setHistoricoFiltrado(historico);
    calcularEstatisticas(historico);
    setModalFiltroVisible(false);
  }

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    
    if (selectedDate) {
      setDateObj(selectedDate);
      
      const dia = String(selectedDate.getDate()).padStart(2, '0');
      const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const ano = selectedDate.getFullYear();
      
      setDataFiltro(`${dia}/${mes}/${ano}`);
    }
  };

  async function exportarParaExcel() {
    if (historicoFiltrado.length === 0) {
      mostrarAviso("Atenção", "Não há dados na tela para gerar a planilha de exportação.");
      return;
    }

    try {
      let csvString = "\uFEFFID;Placa;Velocidade;Status;Data\n";

      historicoFiltrado.forEach(item => {
        const placa = item.placa || 'Desconhecida';
        const velocidade = `${item.velocidade} km/h`;
        const status = item.velocidade > 20 ? 'Infração' : 'OK';
        const data = formatarDataSegura(item.data_hora);
        
        csvString += `${item.id};${placa};${velocidade};${status};${data}\n`;
      });

      const uri = FileSystem.cacheDirectory + 'meu_historico_smartdrive.csv';
      
      await FileSystem.writeAsStringAsync(uri, csvString, {
        encoding: 'utf8' 
      });
      
      await Sharing.shareAsync(uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Exportar Meu Histórico',
        UTI: 'public.comma-separated-values-text'
      });

    } catch (error) {
      console.log("Erro ao exportar:", error);
      mostrarAviso("Falha na Exportação", "Ocorreu um erro ao tentar gerar o arquivo.");
    }
  }

  const renderItem = ({ item }: { item: Infracao }) => {
    const isInfracao = item.velocidade > 20 || item.status === 'Infração';
    
    return (
      <View style={styles.listItem}>
        <Text style={styles.listItemText}>
          {item.placa || 'PLACA'}  -  {item.velocidade} km/h  -  
          <Text style={[styles.boldText, { color: isInfracao ? '#ff4444' : '#fff' }]}>
            {isInfracao ? ' Infração' : ' OK'}
          </Text>
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Header />
      
      <View style={styles.container}>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.titulo}>Minhas Passagens</Text>
          
          {dataFiltro !== "" && (
            <TouchableOpacity style={styles.badgeFiltro} onPress={limparFiltro}>
              <Text style={styles.badgeFiltroText}>{dataFiltro}  ✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Passagens:</Text>
            <Text style={styles.statValue}>{stats.passagens}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Infrações:</Text>
            <Text style={styles.statValue}>{stats.infracoes}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Sua Média:</Text>
            <Text style={styles.statValue}>{stats.media} km/h</Text>
          </View>
        </View>

        <View style={styles.listWrapper}>
          <FlatList
            data={historicoFiltrado}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.listContent}
          />
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.btnFiltrar} onPress={() => setModalFiltroVisible(true)}>
            <Text style={styles.btnTextFiltrar}>Filtrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnExportar} onPress={exportarParaExcel}>
            <Text style={styles.btnTextExportar}>Exportar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modalFiltroVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar por Data</Text>
            
            <TouchableOpacity 
              style={styles.inputModal} 
              onPress={() => setShowPicker(true)}
            >
              <Text style={{ color: dataFiltro ? '#fff' : '#888', textAlign: 'center', fontSize: 16 }}>
                {dataFiltro ? dataFiltro : "Toque para escolher a data"}
              </Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={dateObj}
                mode="date"
                display="default"
                onChange={onChangeDate}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelarBtn} onPress={limparFiltro}>
                <Text style={styles.cancelarText}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.salvarBtn} onPress={aplicarFiltroData}>
                <Text style={styles.salvarText}>Buscar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={modalAvisoVisible} onRequestClose={() => setModalAvisoVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalAvisoTitle}</Text>
            <Text style={styles.modalMessage}>{modalAvisoMessage}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setModalAvisoVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 40 },
  headerTitleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  titulo: { color: "#fff", fontSize: 20, fontWeight: 'bold' },
  badgeFiltro: { backgroundColor: '#333', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D9FF00' },
  badgeFiltroText: { color: '#D9FF00', fontWeight: 'bold', fontSize: 12 },
  statsContainer: { marginBottom: 15 },
  statCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 15, borderRadius: 20, marginBottom: 10 },
  statLabel: { color: '#ccc', fontSize: 14 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  listWrapper: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 20, marginBottom: 20, paddingHorizontal: 5 },
  listContent: { padding: 15 },
  listItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  listItemText: { color: '#fff', fontSize: 14 },
  boldText: { fontWeight: 'bold' },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 100 },
  btnFiltrar: { flex: 1, backgroundColor: '#6b7200', padding: 15, borderRadius: 20, alignItems: 'center', marginRight: 10 },
  btnExportar: { flex: 1, backgroundColor: '#D9FF00', padding: 15, borderRadius: 20, alignItems: 'center', marginLeft: 10 },
  btnTextFiltrar: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnTextExportar: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#1e1e1e', padding: 20, borderRadius: 20, alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  inputModal: { width: '100%', backgroundColor: '#000', padding: 15, borderRadius: 10, marginBottom: 20, justifyContent: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  cancelarBtn: { padding: 15, flex: 1, alignItems: 'center' },
  cancelarText: { color: '#888', fontWeight: 'bold' },
  salvarBtn: { backgroundColor: '#D9FF00', padding: 15, borderRadius: 10, flex: 1, alignItems: 'center' },
  salvarText: { color: '#000', fontWeight: 'bold' },
  modalMessage: { fontSize: 16, color: "#94a3b8", textAlign: "center", marginBottom: 20 },
  modalButton: { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 40, borderRadius: 8 },
  modalButtonText: { color: "#000000", fontWeight: "bold", fontSize: 16 }
});