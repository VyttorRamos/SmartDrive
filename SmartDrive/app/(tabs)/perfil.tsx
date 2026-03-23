import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Header from "@/components/Header";
import { User, ChevronRight } from 'lucide-react-native';

export default function Perfil() {
    const [userData, setUserData] = useState({ id: '', nome: '', cpf: '', telefone: '', email: '', tipo: '' });
    const [modalVisible, setModalVisible] = useState(false);
    const [campoEditando, setCampoEditando] = useState('');
    const [valorTemporario, setValorTemporario] = useState('');

    useEffect(() => {
        async function loadUser() {
            const userString = await AsyncStorage.getItem('user');
            if (userString) {
                setUserData(JSON.parse(userString));
            }
        }
        loadUser();
    }, []);

    async function handleLogout() {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        router.replace('/');
    }

    function abrirEdicao(campo: string, valorAtual: string) {
        setCampoEditando(campo);
        setValorTemporario(valorAtual || '');
        setModalVisible(true);
    }

    async function salvarAlteracao() {
        const dadosAtualizados = { ...userData, [campoEditando]: valorTemporario };

        try {
            const response = await fetch(`http://192.168.1.198:3000/usuarios/${userData.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dadosAtualizados),
            });

            const result = await response.json();

            if (result.success) {
                setUserData(dadosAtualizados);
                await AsyncStorage.setItem('user', JSON.stringify(dadosAtualizados));
                setModalVisible(false);
            } else {
                alert("Erro ao salvar no banco.");
            }
        } catch (error) {
            console.log(error);
            alert("Erro de conexão.");
        }
    }

    return (
        <View style={styles.screen}>
            <Header />
            <ScrollView contentContainerStyle={styles.container}>
                
                <View style={styles.profileHeader}>
                    <View style={styles.iconContainer}>
                        <User size={40} color="#000" />
                    </View>
                    <Text style={styles.titulo}>{userData.nome || 'Carregando...'}</Text>
                    <Text style={styles.subtitulo}>ID: {userData.id} | Tipo: {userData.tipo}</Text>
                </View>

                <Text style={styles.sectionTitle}>Dados Pessoais</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.row} onPress={() => abrirEdicao('nome', userData.nome)}>
                        <View>
                            <Text style={styles.value}>Nome</Text>
                            <Text style={styles.label}>{userData.nome || 'Não informado'}</Text>
                        </View>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.row} onPress={() => abrirEdicao('cpf', userData.cpf)}>
                        <View>
                            <Text style={styles.value}>CPF</Text>
                            <Text style={styles.label}>{userData.cpf || 'Não informado'}</Text>
                        </View>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.row} onPress={() => abrirEdicao('telefone', userData.telefone)}>
                        <View>
                            <Text style={styles.value}>Telefone</Text>
                            <Text style={styles.label}>{userData.telefone || 'Não informado'}</Text>
                        </View>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.row} onPress={() => abrirEdicao('email', userData.email)}>
                        <View>
                            <Text style={styles.value}>E-mail</Text>
                            <Text style={styles.label}>{userData.email || 'Não informado'}</Text>
                        </View>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Configurações</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.row}>
                        <Text style={styles.value}>Notificações</Text>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.row}>
                        <Text style={styles.value}>Segurança</Text>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.row}>
                        <Text style={styles.value}>Privacidade</Text>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.row}>
                        <Text style={styles.value}>Ajuda e Suporte</Text>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Sair da Conta</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Editar {campoEditando.toUpperCase()}</Text>
                        
                        <TextInput
                            style={styles.inputModal}
                            value={valorTemporario}
                            onChangeText={setValorTemporario}
                            placeholder={`Digite seu novo ${campoEditando}`}
                            placeholderTextColor="#888"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelarBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelarText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.salvarBtn} onPress={salvarAlteracao}>
                                <Text style={styles.salvarText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
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
        alignItems: 'stretch',
        paddingBottom: 100,
        paddingTop: 40,
    },
    profileHeader: {
        backgroundColor: "#1e1e1e",
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#D9FF00',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    titulo: {
        color: "#fff",
        fontSize: 20,
        fontWeight: 'bold',
    },
    subtitulo: {
        color: "#888",
        fontSize: 14,
        marginTop: 5,
    },
    sectionTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
    },
    card: {
        backgroundColor: "#1e1e1e",
        borderRadius: 20,
        marginBottom: 20,
        paddingVertical: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginHorizontal: 20,
    },
    label: {
        color: "#888",
        fontSize: 12,
        marginTop: 2,
    },
    value: {
        color: "#fff",
        fontSize: 15,
        fontWeight: '500',
    },
    logoutButton: {
        backgroundColor: "#D9FF00",
        padding: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#1e1e1e',
        padding: 20,
        borderRadius: 20,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    inputModal: {
        backgroundColor: '#000',
        color: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelarBtn: {
        padding: 15,
        flex: 1,
        alignItems: 'center',
    },
    cancelarText: {
        color: '#888',
        fontWeight: 'bold',
    },
    salvarBtn: {
        backgroundColor: '#D9FF00',
        padding: 15,
        borderRadius: 10,
        flex: 1,
        alignItems: 'center',
    },
    salvarText: {
        color: '#000',
        fontWeight: 'bold',
    }
});