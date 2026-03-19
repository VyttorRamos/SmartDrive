import { View, Text, StyleSheet, Image } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Header from "@/components/Header";

export default function Dashboard() {

  return (
    <View style={styles.screen}>
        <Header />
        <View style={styles.container}>
            <Text style={styles.titulo}>Dashboard</Text>
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
    padding: 20,
  },
  titulo: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 20,
  },
});