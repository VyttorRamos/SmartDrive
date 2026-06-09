import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Image } from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "@/components/Header";
import { API_URL } from "@/constants/api";
import { useFocusEffect } from '@react-navigation/native';
import { Bell, ListChecks, Activity, CircleUserRound, MapPin, ShieldAlert, AlertTriangle } from 'lucide-react-native';

type Infracao = {
    id: number;
    placa: string;
    velocidade: number;
    status: string;
    data_hora: string;
};

export default function Perfil() {
    const [usuario, setUsuario] = useState<{ id: number, nome: string } | null>(null);
    const [todasLeituras, setTodasLeituras] = useState<Infracao[]>([]);
    const [carregando, setCarregando] = useState(true);

    const [avisoVisible, setAvisoVisible] = useState(false);
    const [avisoTitle, setAvisoTitle] = useState("");
    const [avisoMessage, setAvisoMessage] = useState("");
    
    const [infoModalConfig, setInfoModalConfig] = useState({ visible: false, tipo: '' });

    const [modalEducativoVisible, setModalEducativoVisible] = useState(false);
    const [tempoLeitura, setTempoLeitura] = useState(0);
    const [infracaoSelecionada, setInfracaoSelecionada] = useState<Infracao | null>(null);

    const [modalNotificacoesVisible, setModalNotificacoesVisible] = useState(false);
    const [badgeOculto, setBadgeOculto] = useState(false);

    const [ocultarMenu, setOcultarMenu] = useState(false);
    const ultimoScrollY = useRef(0);

    const rastrearScroll = (event: any) => {
        const scrollAtual = event.nativeEvent.contentOffset.y;
        if (scrollAtual <= 0) {
            setOcultarMenu(false);
            ultimoScrollY.current = scrollAtual;
            return;
        }
        const diferenca = scrollAtual - ultimoScrollY.current;
        if (Math.abs(diferenca) > 20) {
            setOcultarMenu(diferenca > 0);
            ultimoScrollY.current = scrollAtual;
        }
    };

    function mostrarAviso(titulo: string, mensagem: string) {
        setAvisoTitle(titulo);
        setAvisoMessage(mensagem);
        setAvisoVisible(true);
    }

    function abrirNotificacoes() {
        setBadgeOculto(true);
        setModalNotificacoesVisible(true);
    }

    function abrirModalEducativo(infracao: Infracao) {
        setInfracaoSelecionada(infracao);
        setTempoLeitura(10); 
        setModalEducativoVisible(true);
    }

    async function confirmarLeitura() {
        if (!infracaoSelecionada) return;

        setTodasLeituras(prev => prev.map(inf => 
            inf.id === infracaoSelecionada.id ? { ...inf, status: 'visualizada' } : inf
        ));
        
        setModalEducativoVisible(false);

        try {
            const lidasSalvas = await AsyncStorage.getItem("infracoes_lidas");
            let lidasArray: number[] = lidasSalvas ? JSON.parse(lidasSalvas) : [];
            
            if (!lidasArray.includes(infracaoSelecionada.id)) {
                lidasArray.push(infracaoSelecionada.id);
                await AsyncStorage.setItem("infracoes_lidas", JSON.stringify(lidasArray));
            }

            await fetch(`${API_URL}/infracoes/${infracaoSelecionada.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'visualizada' })
            });
        } catch (error) {
            console.log("Servidor não processou a atualização, mas a memória local salvou.");
        }
    }

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (modalEducativoVisible && tempoLeitura > 0) {
            timer = setTimeout(() => {
                setTempoLeitura(tempoLeitura - 1);
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [modalEducativoVisible, tempoLeitura]);

    useFocusEffect(
        useCallback(() => {
            carregarDadosDinamicos();
            setBadgeOculto(false);
        }, [])
    );

    async function carregarDadosDinamicos() {
        setCarregando(true);
        try {
            const userData = await AsyncStorage.getItem("user");
            if (!userData) return;
            const parsedUser = JSON.parse(userData);
            setUsuario(parsedUser);

            const lidasSalvas = await AsyncStorage.getItem("infracoes_lidas");
            const lidasArray: number[] = lidasSalvas ? JSON.parse(lidasSalvas) : [];

            const response = await fetch(`${API_URL}/infracoes`);
            const data = await response.json();

            const minhasLeituras = data
                .filter((inf: any) => inf.usuario_id === parsedUser.id)
                .map((inf: any) => ({
                    ...inf,
                    status: lidasArray.includes(inf.id) ? 'visualizada' : inf.status
                }));

            setTodasLeituras(minhasLeituras);

        } catch (error) {
            console.log("Erro ao carregar perfil:", error);
            mostrarAviso("Erro", "Não foi possível carregar seus dados.");
        } finally {
            setCarregando(false);
        }
    }

    function formatarDataHora(dataBanco: string) {
        if (!dataBanco) return { data: '', hora: '' };
        try {
            const d = new Date(dataBanco);
            const dataStr = d.toLocaleDateString('pt-BR');
            const horaStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            return { 
                data: dataStr !== 'Invalid Date' ? dataStr : '', 
                hora: horaStr !== 'Invalid Date' ? horaStr : '' 
            };
        } catch (e) {
            return { data: '', hora: '' };
        }
    }

    const passagensTotais = todasLeituras.length;
    const infracoesReais = todasLeituras.filter(i => i.velocidade > 20);
    const totalInfracoes = infracoesReais.length;
    
    const infracoesPendentes = infracoesReais.filter(i => i.status === 'pendente');
    const notificacoesNaoLidas = infracoesPendentes.length;
    
    const pontosCalculados = totalInfracoes * 5; 
    const infracoesRecentes = infracoesReais.slice(0, 3); 

    return (
        <View style={styles.screen}>
            <Header ocultar={ocultarMenu} />

            <ScrollView 
                contentContainerStyle={styles.container} 
                showsVerticalScrollIndicator={false}
                onScroll={rastrearScroll}
                scrollEventThrottle={16}
            >

                <View style={styles.header}>
                    <View style={styles.profileInfo}>
                        <Text style={styles.nome}>Olá, {usuario ? usuario.nome : "Carregando..."}</Text>
                    </View>
                    <TouchableOpacity style={styles.notificationBtn} onPress={abrirNotificacoes}>
                        <Bell color="#ffffff" size={24} />
                        {notificacoesNaoLidas > 0 && !badgeOculto && <View style={styles.notificationBadge} />}
                    </TouchableOpacity>
                </View>

                {carregando ? (
                    <ActivityIndicator size="large" color="#D9FF00" style={{ marginTop: 50 }} />
                ) : (
                    <>
                        <View style={styles.topCard}>
                            <Text style={styles.topCardTitle}>Sua Pontuação:</Text>
                            <View style={styles.pointsRow}>
                                <Text style={styles.pointsValue}>{pontosCalculados}</Text>
                                <Text style={styles.pointsTotal}>/ 40 pontos</Text>
                                <TouchableOpacity style={styles.topCardIconBtn} onPress={() => setInfoModalConfig({ visible: true, tipo: 'infracoes' })}>
                                    <ShieldAlert color="#000" size={32} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.topCardSub}>{pontosCalculados >= 40 ? "Advertido" : "Situação Regular"}</Text>
                            <Text style={styles.topCardTime}>Status dinâmico atualizado</Text>
                        </View>

                        <View style={styles.grid}>
                            <TouchableOpacity style={styles.gridCard} onPress={() => setInfoModalConfig({ visible: true, tipo: 'infracoes' })}>
                                <ListChecks color="#D9FF00" size={32} style={styles.gridIcon} />
                                <Text style={styles.gridValue}>{totalInfracoes}</Text>
                                <Text style={styles.gridLabel}>Minhas Infrações</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.gridCard} onPress={() => setInfoModalConfig({ visible: true, tipo: 'passagens' })}>
                                <Activity color="#D9FF00" size={32} style={styles.gridIcon} />
                                <Text style={styles.gridValue}>{passagensTotais}</Text>
                                <Text style={styles.gridLabel}>Passagens Totais</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.recentSection}>
                            <Text style={styles.recentTitle}>Infrações Recentes</Text>

                            {infracoesRecentes.length > 0 ? infracoesRecentes.map((item) => {
                                const statusUI = item.status === 'pendente' ? 'PENDENTE' : 'VISUALIZADA';
                                const corStatus = statusUI === 'PENDENTE' ? '#D9FF00' : '#333';
                                const corTextoStatus = statusUI === 'PENDENTE' ? '#000' : '#fff';
                                const { data, hora } = formatarDataHora(item.data_hora);

                                return (
                                    <TouchableOpacity 
                                        key={item.id} 
                                        style={styles.recentCard} 
                                        onPress={() => abrirModalEducativo(item)}
                                    >
                                        <View style={styles.recentCardHeader}>
                                            <View style={[styles.statusBadge, { backgroundColor: corStatus }]}>
                                                <Text style={[styles.statusText, { color: corTextoStatus }]}>{statusUI}</Text>
                                            </View>
                                            <Text style={styles.fineDate}>{data} {hora}</Text>
                                        </View>
                                        <Text style={styles.fineType}>Excesso de Velocidade</Text>
                                        <View style={styles.fineLocation}>
                                            <MapPin color={statusUI === 'PENDENTE' ? "#D9FF00" : "#888"} size={16} />
                                            <Text style={styles.locationText}>{item.velocidade} km/h detectados na via principal</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }) : (
                                <Text style={{ color: '#888', textAlign: 'center', marginVertical: 20 }}>Você não possui infrações recentes.</Text>
                            )}
                        </View>
                    </>
                )}

                <TouchableOpacity style={styles.safetyBtn} onPress={() => mostrarAviso('Segurança', 'Mantenha a velocidade dentro do limite estabelecido de 20 km/h para evitar multas.')}>
                    <Text style={styles.safetyBtnText}>Ver Dicas de Segurança</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.faqBtn} onPress={() => mostrarAviso('FAQ', 'Entre em contato com a administração em caso de dúvidas.')}>
                    <Text style={styles.faqBtnText}>Dúvidas Frequentes (FAQ)</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={modalNotificacoesVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentNotificacoes}>
                        <View style={styles.modalHeaderPoints}>
                            <Bell color="#D9FF00" size={28} />
                            <Text style={styles.modalTitlePoints}>Suas Notificações</Text>
                        </View>
                        
                        <ScrollView style={{ width: '100%', maxHeight: 300 }}>
                            {infracoesPendentes.length > 0 ? (
                                infracoesPendentes.map(inf => {
                                    const { data, hora } = formatarDataHora(inf.data_hora);
                                    return (
                                        <View key={inf.id} style={styles.itemNotificacao}>
                                            <AlertTriangle color="#D9FF00" size={20} style={{ marginRight: 15 }} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.tituloItemNotificacao}>Compareça ao Administrativo</Text>
                                                <Text style={styles.textoItemNotificacao}>Referente à infração do dia {data} às {hora} ({inf.velocidade} km/h).</Text>
                                            </View>
                                        </View>
                                    );
                                })
                            ) : (
                                <Text style={{ color: '#888', textAlign: 'center', marginVertical: 20 }}>Tudo limpo! Nenhuma notificação pendente.</Text>
                            )}
                        </ScrollView>

                        <TouchableOpacity style={[styles.btnModalClose, { marginTop: 20 }]} onPress={() => setModalNotificacoesVisible(false)}>
                            <Text style={styles.btnTextClose}>Fechar Painel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={modalEducativoVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentEducativo}>
                        <AlertTriangle color="#D9FF00" size={48} style={{ marginBottom: 15 }} />
                        <Text style={styles.modalTitleEducativo}>Atenção à Segurança!</Text>
                        
                        <ScrollView style={styles.scrollEducativo} showsVerticalScrollIndicator={false}>
                            <Text style={styles.textoEducativoDestaque}>
                                Infração registrada a {infracaoSelecionada?.velocidade} km/h.
                            </Text>
                            <Text style={styles.textoEducativo}>
                                A segurança é o nosso pilar principal na empresa. O limite rigoroso de <Text style={{fontWeight: 'bold', color: '#fff'}}>20 km/h</Text> no nosso estacionamento não é apenas uma regra, é uma medida essencial para proteger a vida de todos os colaboradores que circulam a pé pelo local.
                                {"\n\n"}
                                A baixa velocidade em estacionamentos costuma gerar distrações. Lembre-se: acidentes em nossa área interna são considerados acidentes de trabalho e são totalmente evitáveis.
                                {"\n\n"}
                                Contamos com o seu respeito às normas para manter nosso ambiente de trabalho seguro para todos. Zele pela vida!
                            </Text>
                        </ScrollView>

                        <TouchableOpacity 
                            style={[styles.btnModalClose, tempoLeitura > 0 ? { backgroundColor: '#333' } : { backgroundColor: '#D9FF00' }]} 
                            onPress={confirmarLeitura}
                            disabled={tempoLeitura > 0}
                        >
                            <Text style={[styles.btnTextClose, tempoLeitura > 0 ? { color: '#888' } : { color: '#000' }]}>
                                {tempoLeitura > 0 ? `Leia a mensagem (${tempoLeitura}s)` : 'Estou Ciente e Concordo'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={infoModalConfig.visible} transparent={true} animationType="fade" onRequestClose={() => setInfoModalConfig({ ...infoModalConfig, visible: false })}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentPoints}>
                        <View style={styles.modalHeaderPoints}>
                            {infoModalConfig.tipo === 'passagens' ? (
                                <Activity color="#D9FF00" size={32} />
                            ) : (
                                <CircleUserRound color="#D9FF00" size={32} />
                            )}
                            <Text style={styles.modalTitlePoints}>
                                {infoModalConfig.tipo === 'passagens' ? "Monitoramento Ativo" : "Entenda Suas Infrações"}
                            </Text>
                        </View>
                        <View style={styles.pointsList}>
                            <View style={styles.pointsItem}>
                                <Text style={styles.pointsLevel}>
                                    {infoModalConfig.tipo === 'passagens' 
                                        ? "Este contador registra todas as vezes que o seu veículo foi detectado pelas câmeras e sensores na portaria, incluindo passagens dentro e fora do limite de velocidade." 
                                        : "Neste ambiente, cada registro acima do limite de 20 km/h contabiliza 5 pontos de advertência no seu cadastro."}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.modalButtonsDuplos}>
                            <TouchableOpacity style={styles.btnModalClose} onPress={() => setInfoModalConfig({ ...infoModalConfig, visible: false })}>
                                <Text style={styles.btnTextClose}>Fechar Entendimento</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
    backgroundColor: "#000000",
  },

  container: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 120,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  nome: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  notificationBtn: {
    position: "relative",
  },

  notificationBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D9FF00",
    borderWidth: 2,
    borderColor: "#000000",
  },

  topCard: {
    backgroundColor: "#D9FF00",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  topCardTitle: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },

  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  pointsValue: {
    color: "#000000",
    fontSize: 32,
    fontWeight: "bold",
  },

  pointsTotal: {
    color: "#000000",
    fontSize: 16,
    marginLeft: 5,
  },

  topCardIconBtn: {
    marginLeft: "auto",
  },

  topCardSub: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },

  topCardTime: {
    color: "#000000",
    fontSize: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  gridCard: {
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    width: "48%",
    padding: 20,
    marginBottom: 15,
  },

  gridIcon: {
    marginBottom: 10,
  },

  gridValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },

  gridLabel: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 5,
  },

  recentSection: {
    marginBottom: 20,
  },

  recentTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  recentCard: {
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },

  recentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },

  statusText: {
    fontWeight: "bold",
    fontSize: 14,
  },

  fineDate: {
    color: "#94a3b8",
    fontSize: 12,
  },

  fineType: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },

  fineLocation: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationText: {
    color: "#94a3b8",
    fontSize: 14,
    marginLeft: 5,
  },

  safetyBtn: {
    backgroundColor: "#D9FF00",
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 15,
  },

  safetyBtnText: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 16,
  },

  faqBtn: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
  },

  faqBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContentNotificacoes: {
    width: "90%",
    backgroundColor: "#1e1e1e",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },

  itemNotificacao: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    width: "100%",
    borderWidth: 1,
    borderColor: "#333",
  },

  tituloItemNotificacao: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 4,
  },

  textoItemNotificacao: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
  },

  modalContentEducativo: {
    width: "90%",
    backgroundColor: "#111",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },

  modalTitleEducativo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },

  scrollEducativo: {
    maxHeight: 250,
    marginBottom: 25,
  },

  textoEducativoDestaque: {
    color: "#D9FF00",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },

  textoEducativo: {
    color: "#94a3b8",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "justify",
  },

  modalContentPoints: {
    width: "85%",
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },

  modalHeaderPoints: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },

  modalTitlePoints: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 15,
    flex: 1,
  },

  pointsList: {
    width: "100%",
    marginBottom: 20,
  },

  pointsItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingVertical: 10,
  },

  pointsLevel: {
    color: "#94a3b8",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },

  modalButtonsDuplos: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
  },

  btnModalClose: {
    backgroundColor: "#D9FF00",
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    width: "100%",
  },

  btnTextClose: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
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