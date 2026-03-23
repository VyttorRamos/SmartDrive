import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Modal, Alert, ScrollView, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Search } from 'lucide-react-native';

type Usuario = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  tipo: string;
  infracoes: number;
};

type Infracao = {
  id: number;
  placa: string;
  velocidade: number;
  data_hora: string;
  usuario_id: number;
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');

  const [modalVisible, setModalVisible] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  const [modalDetalhesVisible, setModalDetalhesVisible] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  
  const [infracoesDoUsuario, setInfracoesDoUsuario] = useState<Infracao[]>([]);
  const [carregandoInfracoes, setCarregandoInfracoes] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  async function fetchUsuarios() {
    try {
      const response = await fetch("http://192.168.1.198:3000/usuarios");
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.log("Erro ao buscar usuários:", error);
    }
  }

  async function abrirDetalhesUsuario(usuario: Usuario) {
    setUsuarioSelecionado(usuario);
    setInfracoesDoUsuario([]); 
    setCarregandoInfracoes(true);
    setModalDetalhesVisible(true);

    try {
      const response = await fetch("http://192.168.1.198:3000/infracoes");
      const data = await response.json();
      
      const filtradas = data.filter((inf: Infracao) => inf.usuario_id === usuario.id);
      setInfracoesDoUsuario(filtradas);
    } catch (error) {
      console.log("Erro ao buscar infrações do usuário:", error);
    } finally {
      setCarregandoInfracoes(false);
    }
  }

  function formatarDataSegura(dataBanco: string) {
    if (!dataBanco) return '';
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

  async function cadastrarUsuario() {
    if (!novoNome || !novoEmail || !novaSenha) {
      Alert.alert("Atenção", "Preencha pelo menos Nome, Email e Senha.");
      return;
    }

    try {
      const response = await fetch("http://192.168.1.198:3000/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoNome,
          email: novoEmail,
          senha: novaSenha,
          tipo: 'usuario'
        })
      });

      const result = await response.json();
      if (result.success) {
        setModalVisible(false);
        setNovoNome(''); 
        setNovoEmail(''); 
        setNovaSenha('');
        fetchUsuarios(); 
      } else {
        Alert.alert("Erro", "Não foi possível cadastrar.");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Falha na conexão.");
    }
  }

  const usuariosFiltrados = usuarios.filter((user) => {
    const matchBusca = user.nome.toLowerCase().includes(busca.toLowerCase());
    const matchFiltro = filtroAtivo === 'Todos' ? true : user.infracoes > 0;
    return matchBusca && matchFiltro;
  });

  const renderUsuario = ({ item }: { item: Usuario }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.nomeUsuario}>{item.nome}</Text>
        <Text style={styles.infracoesText}>
          {item.infracoes} {item.infracoes === 1 ? 'infração' : 'infrações'} de velocidade
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.detalhesButton}
        onPress={() => abrirDetalhesUsuario(item)}
      >
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
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        <View style={styles.filtrosContainer}>
          {['Todos', 'Infratores', 'Novo'].map((filtro) => (
            <TouchableOpacity
              key={filtro}
              style={[
                styles.filtroButton,
                filtroAtivo === filtro && filtro !== 'Novo' ? styles.filtroAtivo : styles.filtroInativo
              ]}
              onPress={() => {
                if (filtro === 'Novo') {
                  setModalVisible(true);
                } else {
                  setFiltroAtivo(filtro);
                }
              }}
            >
              <Text style={[
                styles.filtroText,
                filtroAtivo === filtro && filtro !== 'Novo' ? styles.filtroTextAtivo : styles.filtroTextInativo
              ]}>
                {filtro}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={usuariosFiltrados}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUsuario}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }} 
        />
      </View>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Usuário</Text>
            
            <TextInput
              style={styles.inputModal}
              placeholder="Nome completo"
              placeholderTextColor="#888"
              value={novoNome}
              onChangeText={setNovoNome}
            />
            <TextInput
              style={styles.inputModal}
              placeholder="E-mail"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
              value={novoEmail}
              onChangeText={setNovoEmail}
            />
            <TextInput
              style={styles.inputModal}
              placeholder="Senha"
              placeholderTextColor="#888"
              secureTextEntry
              value={novaSenha}
              onChangeText={setNovaSenha}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelarBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.salvarBtn} onPress={cadastrarUsuario}>
                <Text style={styles.salvarText}>Cadastrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalDetalhesVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Detalhes do Usuário</Text>
            
            {usuarioSelecionado && (
              <View style={{ width: '100%' }}>
                <View style={styles.detalhesBox}>
                  <Text style={styles.detalhesItem}><Text style={styles.bold}>Nome:</Text> {usuarioSelecionado.nome}</Text>
                  <Text style={styles.detalhesItem}><Text style={styles.bold}>E-mail:</Text> {usuarioSelecionado.email || 'Não informado'}</Text>
                  <Text style={styles.detalhesItem}><Text style={styles.bold}>Tipo:</Text> {usuarioSelecionado.tipo}</Text>
                  <Text style={styles.detalhesItem}><Text style={styles.bold}>Total de Infrações:</Text> {usuarioSelecionado.infracoes}</Text>
                </View>

                <Text style={styles.subTituloInfracoes}>Histórico deste usuário:</Text>
                
                <View style={styles.listaInfracoesContainer}>
                  {carregandoInfracoes ? (
                    <ActivityIndicator color="#D9FF00" style={{ padding: 20 }} />
                  ) : infracoesDoUsuario.length > 0 ? (
                    <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 150 }}>
                      {infracoesDoUsuario.map((inf) => (
                        <View key={inf.id} style={styles.infracaoItem}>
                          <Text style={styles.infracaoPlaca}>{inf.placa || 'Sem Placa'}</Text>
                          <View>
                            <Text style={styles.infracaoVelocidade}>{inf.velocidade} km/h</Text>
                            <Text style={styles.infracaoData}>{formatarDataSegura(inf.data_hora)}</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.semInfracoes}>Nenhuma infração registrada para este usuário.</Text>
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.fecharBtn} onPress={() => setModalDetalhesVisible(false)}>
              <Text style={styles.fecharText}>Fechar</Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
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
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
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
  detalhesBox: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
  },
  detalhesItem: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  bold: {
    color: '#fff',
    fontWeight: 'bold',
  },
  subTituloInfracoes: {
    color: '#D9FF00',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 10,
  },
  listaInfracoesContainer: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    width: '100%',
  },
  infracaoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infracaoPlaca: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infracaoVelocidade: {
    color: '#ff4444',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  infracaoData: {
    color: '#888',
    fontSize: 12,
    textAlign: 'right',
  },
  semInfracoes: {
    color: '#888',
    textAlign: 'center',
    padding: 15,
  },
  
  fecharBtn: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  fecharText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});