import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Switch } from "react-native";
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

    const [configModalVisible, setConfigModalVisible] = useState(false);
    const [configTipo, setConfigTipo] = useState('');

    const [notificacaoPush, setNotificacaoPush] = useState(true);
    const [notificacaoEmail, setNotificacaoEmail] = useState(true);
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');

    const [modalAvisoVisible, setModalAvisoVisible] = useState(false);
    const [modalAvisoTitle, setModalAvisoTitle] = useState("");
    const [modalAvisoMessage, setModalAvisoMessage] = useState("");

    useEffect(() => {
        async function loadUser() {
            const userString = await AsyncStorage.getItem('user');
            if (userString) {
                setUserData(JSON.parse(userString));
            }

            const pushPref = await AsyncStorage.getItem('notif_push');
            const emailPref = await AsyncStorage.getItem('notif_email');
            if (pushPref !== null) setNotificacaoPush(pushPref === 'true');
            if (emailPref !== null) setNotificacaoEmail(emailPref === 'true');
        }
        loadUser();
    }, []);

    function mostrarAviso(titulo: string, mensagem: string) {
        setModalAvisoTitle(titulo);
        setModalAvisoMessage(mensagem);
        setModalAvisoVisible(true);
    }

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

    function abrirConfiguracao(tipo: string) {
        setConfigTipo(tipo);
        setConfigModalVisible(true);
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
                mostrarAviso("Sucesso", "Dados atualizados com sucesso!");
            } else {
                mostrarAviso("Erro", "Erro ao salvar as informações no banco de dados.");
            }
        } catch (error) {
            console.log(error);
            mostrarAviso("Erro de Conexão", "Não foi possível conectar ao servidor.");
        }
    }

    // --- FUNÇÕES REAIS DE SEGURANÇA E NOTIFICAÇÃO ---

    async function alterarSenha() {
        if (!senhaAtual || !novaSenha) {
            mostrarAviso("Atenção", "Preencha a senha atual e a nova senha.");
            return;
        }

        try {
            const response = await fetch(`http://192.168.1.198:3000/usuarios/${userData.id}/senha`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senhaAtual, novaSenha }),
            });
            const result = await response.json();

            if (result.success) {
                setConfigModalVisible(false);
                setSenhaAtual('');
                setNovaSenha('');
                mostrarAviso("Sucesso", "Sua senha foi atualizada com segurança.");
            } else {
                // Mostra o erro que veio lá do backend (ex: Senha atual incorreta)
                mostrarAviso("Erro", result.message || "Não foi possível alterar a senha.");
            }
        } catch (error) {
            mostrarAviso("Erro de Conexão", "Não foi possível conectar ao servidor.");
        }
    }

    async function atualizarPreferenciaBanco(tipo: 'push' | 'email', valor: boolean) {
        try {
            await fetch(`http://192.168.1.198:3000/usuarios/${userData.id}/notificacoes`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tipo === 'push' ? { push: valor } : { email: valor }),
            });
        } catch (error) {
            console.log("Erro ao salvar notificação no banco", error);
        }
    }

    async function toggleNotificacaoPush(valor: boolean) {
        setNotificacaoPush(valor);
        await AsyncStorage.setItem('notif_push', String(valor));
        await atualizarPreferenciaBanco('push', valor);
    }

    async function toggleNotificacaoEmail(valor: boolean) {
        setNotificacaoEmail(valor);
        await AsyncStorage.setItem('notif_email', String(valor));
        await atualizarPreferenciaBanco('email', valor);
    }

    const renderConfigContent = () => {
        switch (configTipo) {
            case 'notificacoes':
                return (
                    <View style={styles.configContentBox}>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchText}>Notificações Push (Celular)</Text>
                            <Switch
                                trackColor={{ false: "#333", true: "#6b7200" }}
                                thumbColor={notificacaoPush ? "#D9FF00" : "#888"}
                                onValueChange={toggleNotificacaoPush}
                                value={notificacaoPush}
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.switchRow}>
                            <Text style={styles.switchText}>Avisos por E-mail</Text>
                            <Switch
                                trackColor={{ false: "#333", true: "#6b7200" }}
                                thumbColor={notificacaoEmail ? "#D9FF00" : "#888"}
                                onValueChange={toggleNotificacaoEmail}
                                value={notificacaoEmail}
                            />
                        </View>
                        <TouchableOpacity style={styles.fecharConfigBtn} onPress={() => setConfigModalVisible(false)}>
                            <Text style={styles.fecharText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'seguranca':
                return (
                    <View style={styles.configContentBox}>
                        <TextInput
                            style={styles.inputModal}
                            placeholder="Senha Atual"
                            placeholderTextColor="#888"
                            secureTextEntry
                            value={senhaAtual}
                            onChangeText={setSenhaAtual}
                        />
                        <TextInput
                            style={styles.inputModal}
                            placeholder="Nova Senha"
                            placeholderTextColor="#888"
                            secureTextEntry
                            value={novaSenha}
                            onChangeText={setNovaSenha}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelarBtn} onPress={() => setConfigModalVisible(false)}>
                                <Text style={styles.cancelarText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.salvarBtn} onPress={alterarSenha}>
                                <Text style={styles.salvarText}>Atualizar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 'privacidade':
                return (
                    <View style={styles.configContentBox}>
                        <Text style={styles.infoText}>Seus dados estão protegidos sob a LGPD. As imagens e dados de infração são restritos apenas aos administradores do SmartDrive.</Text>
                        <TouchableOpacity style={styles.fecharConfigBtn} onPress={() => setConfigModalVisible(false)}>
                            <Text style={styles.fecharText}>Entendi</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'ajuda':
                return (
                    <View style={styles.configContentBox}>
                        <Text style={styles.infoText}>Precisa de ajuda com o sistema?</Text>
                        <Text style={styles.infoTextDestacado}>suporte@smartdrive.com</Text>
                        <Text style={styles.infoText}>Telefone: (11) 99999-9999</Text>
                        <TouchableOpacity style={styles.fecharConfigBtn} onPress={() => setConfigModalVisible(false)}>
                            <Text style={styles.fecharText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.screen}>
            <Header />
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

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
                    <TouchableOpacity style={styles.row} onPress={() => abrirConfiguracao('notificacoes')}>
                        <Text style={styles.value}>Notificações</Text>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.row} onPress={() => abrirConfiguracao('seguranca')}>
                        <Text style={styles.value}>Segurança</Text>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.row} onPress={() => abrirConfiguracao('privacidade')}>
                        <Text style={styles.value}>Privacidade</Text>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.row} onPress={() => abrirConfiguracao('ajuda')}>
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

            <Modal visible={configModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {configTipo === 'notificacoes' && 'Notificações'}
                            {configTipo === 'seguranca' && 'Segurança'}
                            {configTipo === 'privacidade' && 'Privacidade'}
                            {configTipo === 'ajuda' && 'Ajuda e Suporte'}
                        </Text>

                        {renderConfigContent()}
                    </View>
                </View>
            </Modal>
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalAvisoVisible}
                onRequestClose={() => setModalAvisoVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { alignItems: 'center' }]}>
                        <Text style={styles.modalTitle}>{modalAvisoTitle}</Text>
                        <Text style={styles.infoText}>{modalAvisoMessage}</Text>
                        <TouchableOpacity
                            style={styles.modalButtonAviso}
                            onPress={() => setModalAvisoVisible(false)}
                        >
                            <Text style={styles.modalButtonTextAviso}>OK</Text>
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
        width: '100%',
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
    },
    configContentBox: {
        width: '100%',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
    },
    switchText: {
        color: '#fff',
        fontSize: 16,
    },
    infoText: {
        color: '#ccc',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 10,
    },
    infoTextDestacado: {
        color: '#D9FF00',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    fecharConfigBtn: {
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
    },
    fecharText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalButtonAviso: {
        backgroundColor: "#fff",
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 8,
        marginTop: 10,
    },
    modalButtonTextAviso: {
        color: "#000000",
        fontWeight: "bold",
        fontSize: 16,
    },
});