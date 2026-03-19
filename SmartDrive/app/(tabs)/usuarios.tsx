import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from "react-native";
import { useState } from "react";
import Header from "@/components/Header";
import { Search } from 'lucide-react-native';

const MOCK_DATA = [
  { id: '1', nome: 'Yasmin Lobo', infracoes: 10 },
  { id: '2', nome: 'Vyttor Camillo', infracoes: 0 },
  { id: '3', nome: 'Luis Otávio', infracoes: 2 },
  { id: '4', nome: 'Maria Eduarda', infracoes: 1 },
  { id: '5', nome: 'Anderson', infracoes: 4 },
];

export default function Usuarios() {
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');

  const renderUsuario = ({ item }: { item: typeof MOCK_DATA[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.nomeUsuario}>{item.nome}</Text>
        <Text style={styles.infracoesText}>
          {item.infracoes} {item.infracoes === 1 ? 'infração' : 'infrações'} de velocidade
        </Text>
      </View>
      <TouchableOpacity style={styles.detalhesButton}>
        <Text style={styles.detalhesText}>Detalhes</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Header />
      
      <View style={styles.container}>
        <Text style={styles.titulo}>Usuários</Text>

        <View style={styles.searchContainer}>
          <Search color="#888" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.filtrosContainer}>
          {['Todos', 'Infratores', 'Novo'].map((filtro) => (
            <TouchableOpacity
              key={filtro}
              style={[
                styles.filtroButton,
                filtroAtivo === filtro ? styles.filtroAtivo : styles.filtroInativo
              ]}
              onPress={() => setFiltroAtivo(filtro)}
            >
              <Text style={[
                styles.filtroText,
                filtroAtivo === filtro ? styles.filtroTextAtivo : styles.filtroTextInativo
              ]}>
                {filtro}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={MOCK_DATA}
          keyExtractor={(item) => item.id}
          renderItem={renderUsuario}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40, 
  },
  titulo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  filtrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  filtroAtivo: {
    backgroundColor: '#D9FF00',
  },
  filtroInativo: {
    backgroundColor: '#fff',
  },
  filtroText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  filtroTextAtivo: {
    color: '#000',
  },
  filtroTextInativo: {
    color: '#000',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#D9FF00',
  },
  cardInfo: {
    flex: 1,
  },
  nomeUsuario: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infracoesText: {
    color: '#aaa',
    fontSize: 14,
  },
  detalhesButton: {
    backgroundColor: '#D9FF00',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  detalhesText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
});