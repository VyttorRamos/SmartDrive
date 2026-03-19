import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useState } from "react";
import Header from "@/components/Header";

const MOCK_HISTORICO = [
  { id: '1', placa: 'GHI1234', velocidade: '19 km/h', status: 'OK' },
  { id: '2', placa: 'XYZ4321', velocidade: '27 km/h', status: 'Infração' },
  { id: '3', placa: 'DEF1234', velocidade: '23 km/h', status: 'Infração' },
  { id: '4', placa: 'GHI1234', velocidade: '19 km/h', status: 'OK' },
  { id: '5', placa: 'JKL1234', velocidade: '20 km/h', status: 'OK' },
  { id: '6', placa: 'DEF1234', velocidade: '23 km/h', status: 'Infração' },
  { id: '7', placa: 'GHI1234', velocidade: '19 km/h', status: 'OK' },
  { id: '8', placa: 'JKL1234', velocidade: '20 km/h', status: 'OK' },
];

export default function Historico() {

  const renderItem = ({ item }: { item: typeof MOCK_HISTORICO[0] }) => (
    <View style={styles.listItem}>
      <Text style={styles.listItemText}>
        {item.placa}  -  {item.velocidade}  -  <Text style={styles.boldText}>{item.status}</Text>
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Header />
      
      <View style={styles.container}>
        <Text style={styles.titulo}>Histórico de Infrações</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Veículos Hoje:</Text>
            <Text style={styles.statValue}>54</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Infrações:</Text>
            <Text style={styles.statValue}>7</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Velocidade Média:</Text>
            <Text style={styles.statValue}>19 km/h</Text>
          </View>
        </View>

        <View style={styles.listWrapper}>
          <FlatList
            data={MOCK_HISTORICO}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.listContent}
          />
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.btnFiltrar}>
            <Text style={styles.btnTextFiltrar}>Filtrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnExportar}>
            <Text style={styles.btnTextExportar}>Exportar</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsContainer: {
    marginBottom: 15,
  },
  statCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  statLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listWrapper: {
    flex: 1, 
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginBottom: 20,
    paddingHorizontal: 5, 
  },
  listContent: {
    padding: 15,
  },
  listItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  listItemText: {
    color: '#fff',
    fontSize: 14,
  },
  boldText: {
    fontWeight: 'bold',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 100, 
  },
  btnFiltrar: {
    flex: 1,
    backgroundColor: '#6b7200', 
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginRight: 10,
  },
  btnExportar: {
    flex: 1,
    backgroundColor: '#D9FF00',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginLeft: 10,
  },
  btnTextFiltrar: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  btnTextExportar: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});