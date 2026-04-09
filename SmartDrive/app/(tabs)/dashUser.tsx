import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Image } from "react-native";
import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "@/components/Header";
import { API_URL } from "@/constants/api";
import { useFocusEffect } from '@react-navigation/native';
import { Bell, ListChecks, CheckCircle, Hourglass, CircleUserRound, MapPin, X, ShieldAlert } from 'lucide-react-native';

type Infracao = {
    id: number;
    placa: string;
    velocidade: number;
    status: string;
    data_hora: string;
};

export default function Perfil() {
    const [usuario, setUsuario] = useState<{ id: number, nome: string } | null>(null);
    const [infracoes, setInfracoes] = useState<Infracao[]>([]);
    const [carregando, setCarregando] = useState(true);

    const [avisoVisible, setAvisoVisible] = useState(false);
    const [avisoTitle, setAvisoTitle] = useState("");
    const [avisoMessage, setAvisoMessage] = useState("");
    const [modalPointsVisible, setModalPointsVisible] = useState(false);

    function mostrarAviso(titulo: string, mensagem: string) {
        setAvisoTitle(titulo);
        setAvisoMessage(mensagem);
        setAvisoVisible(true);
    }

    useFocusEffect(
        useCallback(() => {
            carregarDadosDinamicos();
        }, [])
    );

    async function carregarDadosDinamicos() {
        setCarregando(true);
        try {
            const userData = await AsyncStorage.getItem("user");
            if (!userData) return;
            const parsedUser = JSON.parse(userData);
            setUsuario(parsedUser);

            const response = await fetch(`${API_URL}/infracoes`);
            const data = await response.json();

            const minhasInfracoes = data.filter((inf: any) => inf.usuario_id === parsedUser.id);
            setInfracoes(minhasInfracoes);

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
            const apenasDataHora = dataBanco.replace('T', ' ').split('.')[0];
            const [data, hora] = apenasDataHora.split(' ');
            if (data && hora) {
                const [ano, mes, dia] = data.split('-');
                return { data: `${dia}/${mes}/${ano}`, hora: hora.substring(0, 5) };
            }
            return { data: '', hora: '' };
        } catch (e) {
            return { data: '', hora: '' };
        }
    }

    const totalInfracoes = infracoes.length;
    const recebidas = infracoes.filter(i => i.status === 'pendente').length;
    const pontosCalculados = totalInfracoes * 5; 
    const infracoesRecentes = infracoes.slice(0, 3); 

    return (
        <View style={styles.screen}>
            <Header />

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <View style={styles.profileInfo}>
                        <Text style={styles.nome}>Olá, {usuario ? usuario.nome : "Carregando..."}</Text>
                    </View>
                    <TouchableOpacity style={styles.notificationBtn} onPress={() => mostrarAviso('Notificações', 'Você não tem novos alertas.')}>
                        <Bell color="#ffffff" size={24} />
                        {recebidas > 0 && <View style={styles.notificationBadge} />}
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
                                <TouchableOpacity style={styles.topCardIconBtn} onPress={() => setModalPointsVisible(true)}>
                                    <ShieldAlert color="#000" size={32} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.topCardSub}>{pontosCalculados >= 40 ? "Advertido" : "Situação Regular"}</Text>
                            <Text style={styles.topCardTime}>Status dinâmico atualizado</Text>
                        </View>

                        <View style={styles.grid}>
                            <TouchableOpacity style={styles.gridCard} onPress={() => setModalPointsVisible(true)}>
                                <ListChecks color="#D9FF00" size={32} style={styles.gridIcon} />
                                <Text style={styles.gridValue}>{totalInfracoes}</Text>
                                <Text style={styles.gridLabel}>Minhas Infrações</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.gridCard} onPress={() => setModalPointsVisible(true)}>
                                <Hourglass color="#D9FF00" size={32} style={styles.gridIcon} />
                                <Text style={styles.gridValue}>{recebidas}</Text>
                                <Text style={styles.gridLabel}>Recebidas</Text>
                            </TouchableOpacity>

                        </View>

                        <View style={styles.recentSection}>
                            <Text style={styles.recentTitle}>Infrações Recentes</Text>

                            {infracoesRecentes.length > 0 ? infracoesRecentes.map((item) => {
                                const statusUI = item.status === 'pendente' ? 'PENDENTE' : 'RESOLVIDA';
                                const corStatus = statusUI === 'PENDENTE' ? '#D9FF00' : '#333';
                                const corTextoStatus = statusUI === 'PENDENTE' ? '#000' : '#fff';
                                const { data, hora } = formatarDataHora(item.data_hora);

                                return (
                                    <TouchableOpacity key={item.id} style={styles.recentCard} onPress={() => mostrarAviso('Detalhes', `Placa: ${item.placa}\nVelocidade: ${item.velocidade} km/h`)}>
                                        <View style={styles.recentCardHeader}>
                                            <View style={[styles.statusBadge, { backgroundColor: corStatus }]}>
                                                <Text style={[styles.statusText, { color: corTextoStatus }]}>{statusUI}</Text>
                                            </View>
                                            <Text style={styles.fineDate}>{data} {hora}</Text>
                                        </View>
                                        <Text style={styles.fineType}>Excesso de Velocidade</Text>
                                        <View style={styles.fineLocation}>
                                            <MapPin color="#D9FF00" size={16} />
                                            <Text style={styles.locationText}>{item.velocidade} km/h detectados</Text>
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

            <Modal visible={modalPointsVisible} transparent={true} animationType="fade" onRequestClose={() => setModalPointsVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentPoints}>
                        <View style={styles.modalHeaderPoints}>
                            <CircleUserRound color="#D9FF00" size={32} />
                            <Text style={styles.modalTitlePoints}>Entenda Suas Infrações</Text>
                        </View>
                        <View style={styles.pointsList}>
                            <View style={styles.pointsItem}><Text style={styles.pointsLevel}>Neste ambiente, cada registro acima do limite de 20 km/h contabiliza 5 pontos de advertência no seu cadastro.</Text></View>
                        </View>
                        <View style={styles.modalButtonsDuplos}>
                            <TouchableOpacity style={styles.btnModalClose} onPress={() => setModalPointsVisible(false)}>
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
    borderRadius: 25,
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