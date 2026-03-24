import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { AlertTriangle, Activity, CarFront, BarChart3, CalendarDays } from 'lucide-react-native';
import { API_URL } from "@/constants/api";
import DateTimePicker from '@react-native-community/datetimepicker';

type Infracao = {
  id: number;
  placa: string;
  velocidade: number;
  status: string;
  data_hora: string;
};

export default function Dashboard() {
  const [todasInfracoes, setTodasInfracoes] = useState<Infracao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [estatisticas, setEstatisticas] = useState({ veiculosHoje: 0, infracoesHoje: 0, velocidadeMaxima: 0 });
  const [dadosGrafico, setDadosGrafico] = useState<{ dia: string, valor: number }[]>([]);
  const [topInfratores, setTopInfratores] = useState<{ placa: string, total: number, ultimaVelocidade: number }[]>([]);

  useEffect(() => {
    fetchDadosInfracoes();
  }, []);

  useEffect(() => {
    if (todasInfracoes.length > 0) {
      processarDashboard(todasInfracoes, dataSelecionada);
    }
  }, [todasInfracoes, dataSelecionada]);

  async function fetchDadosInfracoes() {
    try {
      setCarregando(true);
      const response = await fetch(`${API_URL}/infracoes`);
      const data = await response.json();
      setTodasInfracoes(data);
    } catch (error) {
      console.log("Erro ao buscar dados do Dashboard:", error);
    } finally {
      setCarregando(false);
    }
  }

  function processarDashboard(dados: Infracao[], dataRef: Date) {
    const formatarData = (d: Date) => {
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const ano = d.getFullYear();
      return `${ano}-${mes}-${dia}`;
    };

    const dataFiltroStr = formatarData(dataRef);

    const extrairDataBanco = (dataHoraBanco: string) => {
      if (!dataHoraBanco) return '';
      return dataHoraBanco.split('T')[0]; 
    };

    const dadosDoDia = dados.filter(item => extrairDataBanco(item.data_hora) === dataFiltroStr);
    const veiculosHoje = dadosDoDia.length;
    const infraDoDia = dadosDoDia.filter(item => item.velocidade > 20 || item.status === 'Infração');
    const infracoesHoje = infraDoDia.length;
    
    const velocidadeMaxima = dadosDoDia.length > 0 
      ? Math.max(...dadosDoDia.map(item => Number(item.velocidade))) 
      : 0;

      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const ultimos7Dias = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(dataRef);
      d.setDate(d.getDate() - i);
      const dStr = formatarData(d);
      const nomeDia = diasSemana[d.getDay()];

      const infNoDia = dados.filter(item => 
        extrairDataBanco(item.data_hora) === dStr && 
        (item.velocidade > 20 || item.status === 'Infração')
      ).length;

      ultimos7Dias.push({ dia: nomeDia, valor: infNoDia });
    }

    const contagemPlacas: Record<string, { total: number, ultimaVelocidade: number }> = {};
    

    const dadosAteHoje = dados.filter(item => extrairDataBanco(item.data_hora) <= dataFiltroStr);

    dadosAteHoje.forEach(item => {
      if (item.velocidade > 20 || item.status === 'Infração') {
        const placa = item.placa || 'Sem Placa';
        if (!contagemPlacas[placa]) {
          contagemPlacas[placa] = { total: 0, ultimaVelocidade: item.velocidade };
        }
        contagemPlacas[placa].total += 1;
 
        contagemPlacas[placa].ultimaVelocidade = item.velocidade;
      }
    });
    const top = Object.entries(contagemPlacas)
      .map(([placa, info]) => ({ placa, total: info.total, ultimaVelocidade: info.ultimaVelocidade }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    setEstatisticas({ veiculosHoje, infracoesHoje, velocidadeMaxima });
    setDadosGrafico(ultimos7Dias);
    setTopInfratores(top);
  }

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setDataSelecionada(selectedDate);
    }
  };

  const maiorValorGrafico = Math.max(...dadosGrafico.map(d => d.valor), 1);

  const dataExibicao = `${String(dataSelecionada.getDate()).padStart(2, '0')}/${String(dataSelecionada.getMonth() + 1).padStart(2, '0')}/${dataSelecionada.getFullYear()}`;

  return (
    <View style={styles.screen}>
      <Header />
      
      {carregando ? (
        <View style={styles.loadingContainer}>
           <ActivityIndicator size="large" color="#D9FF00" />
           <Text style={styles.loadingText}>Calculando estatísticas...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerTitleContainer}>
            <View>
              <Text style={styles.titulo}>Visão Geral</Text>
              <Text style={styles.subtitulo}>Dados do dia: <Text style={{ color: '#D9FF00' }}>{dataExibicao}</Text></Text>
            </View>
            <TouchableOpacity style={styles.btnCalendario} onPress={() => setShowPicker(true)}>
               <CalendarDays color="#000" size={24} />
            </TouchableOpacity>
          </View>

          {showPicker && (
            <DateTimePicker
              value={dataSelecionada}
              mode="date"
              display="default"
              onChange={onChangeDate}
              maximumDate={new Date()} //n deixa ver o futuro
            />
          )}
          <View style={styles.rowCards}>
            <View style={[styles.cardMetade, { borderColor: '#333', borderWidth: 1 }]}>
              <CarFront color="#D9FF00" size={24} style={styles.cardIcon} />
              <Text style={styles.cardValor}>{estatisticas.veiculosHoje}</Text>
              <Text style={styles.cardLabel}>Veículos Lidos</Text>
            </View>

            <View style={[styles.cardMetade, { borderColor: '#ff4444', borderWidth: 1 }]}>
              <AlertTriangle color="#ff4444" size={24} style={styles.cardIcon} />
              <Text style={[styles.cardValor, { color: '#ff4444' }]}>{estatisticas.infracoesHoje}</Text>
              <Text style={styles.cardLabel}>Infrações Hoje</Text>
            </View>
          </View>

          <View style={styles.cardInteiro}>
            <View style={styles.cardInteiroTexto}>
              <Text style={styles.cardLabel}>Maior Velocidade do Dia</Text>
              <Text style={styles.cardValorGrande}>{estatisticas.velocidadeMaxima} <Text style={styles.kmh}>km/h</Text></Text>
            </View>
            <Activity color="#D9FF00" size={40} />
          </View>

          <Text style={styles.sectionTitle}>
              <BarChart3 color="#fff" size={18} style={{ marginRight: 8 }} />
              Infrações na Semana
          </Text>
          <View style={styles.graficoCard}>
            <View style={styles.graficoBarras}>
              {dadosGrafico.map((item, index) => {
                const alturaBarra = (item.valor / maiorValorGrafico) * 100;
                
                return (
                  <View key={index} style={styles.barraContainer}>
                    <Text style={styles.barraValor}>{item.valor}</Text>
                    <View style={styles.barraFundo}>
                      <View style={[styles.barraPreenchimento, { height: `${alturaBarra}%` }]} />
                    </View>
                    <Text style={styles.barraLabel}>{item.dia}</Text>
                  </View>
                );
              })}
            </View>
          </View>
          <Text style={styles.sectionTitle}>Maiores Infratores (Geral)</Text>
          <View style={styles.listaCard}>
            {topInfratores.length > 0 ? topInfratores.map((item, index) => (
              <View key={index} style={styles.infratorRow}>
                <View style={styles.infratorInfo}>
                  <Text style={styles.infratorPlaca}>{item.placa}</Text>
                  <Text style={styles.infratorDetalhe}>Último registro: {item.ultimaVelocidade} km/h</Text>
                </View>
                <View style={styles.infratorBadge}>
                  <Text style={styles.infratorBadgeTexto}>{item.total}x</Text>
                </View>
              </View>
            )) : (
               <Text style={styles.semDadosText}>Nenhum infrator registrado no sistema até o momento.</Text>
            )}
          </View>

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 15,
    fontSize: 16,
  },
  container: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 100,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  titulo: {
    color: "#fff",
    fontSize: 26,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: "#888",
    fontSize: 14,
    marginTop: 4,
  },
  btnCalendario: {
    backgroundColor: '#D9FF00',
    padding: 12,
    borderRadius: 15,
  },
  rowCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  cardMetade: {
    backgroundColor: '#1e1e1e',
    width: '48%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'flex-start',
  },
  cardIcon: {
    marginBottom: 10,
  },
  cardValor: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  cardLabel: {
    color: '#888',
    fontSize: 13,
    marginTop: 5,
  },
  cardInteiro: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#D9FF00',
  },
  cardInteiroTexto: {
    flex: 1,
  },
  cardValorGrande: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 5,
  },
  kmh: {
    fontSize: 16,
    color: '#D9FF00',
    fontWeight: 'normal',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  graficoCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    height: 220,
  },
  graficoBarras: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 20, 
  },
  barraContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barraValor: {
    color: '#888',
    fontSize: 10,
    marginBottom: 5,
  },
  barraFundo: {
    width: 12,
    height: 120,
    backgroundColor: '#111',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barraPreenchimento: {
    width: '100%',
    backgroundColor: '#D9FF00',
    borderRadius: 6,
  },
  barraLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 10,
  },
  listaCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 10,
  },
  infratorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infratorInfo: {
    flex: 1,
  },
  infratorPlaca: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infratorDetalhe: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  infratorBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  infratorBadgeTexto: {
    color: '#D9FF00',
    fontWeight: 'bold',
    fontSize: 14,
  },
  semDadosText: {
    color: '#888',
    textAlign: 'center',
    padding: 20,
  }
});