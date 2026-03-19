import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Header from "@/components/Header";
import { User, ChevronRight } from 'lucide-react-native';

export default function Perfil() {
    async function handleLogout() {
        await AsyncStorage.removeItem('user');
        router.replace('/');
    }

    return (
        <View style={styles.screen}>
            <Header />
            <ScrollView contentContainerStyle={styles.container}>
                
                <View style={styles.profileHeader}>
                    <View style={styles.iconContainer}>
                        <User size={40} color="#000" />
                    </View>
                    <Text style={styles.titulo}>Administrador</Text>
                    <Text style={styles.subtitulo}>ID: 12345</Text>
                </View>

                <Text style={styles.sectionTitle}>Dados Pessoais</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.row}>
                        <View>
                            <Text style={styles.value}>Nome</Text>
                            <Text style={styles.label}>Administrador</Text>
                        </View>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.row}>
                        <View>
                            <Text style={styles.value}>CPF</Text>
                            <Text style={styles.label}>123.456.789-00</Text>
                        </View>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.row}>
                        <View>
                            <Text style={styles.value}>Telefone</Text>
                            <Text style={styles.label}>(12) 98765-4321</Text>
                        </View>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.row}>
                        <View>
                            <Text style={styles.value}>E-mail</Text>
                            <Text style={styles.label}>administracao@gmail.com</Text>
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
});