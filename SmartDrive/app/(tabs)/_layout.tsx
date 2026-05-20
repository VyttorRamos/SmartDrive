import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import { View, ActivityIndicator, Text } from "react-native";

export default function Layout() {
  const [loading, setLoading] = useState(true);
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const user = await AsyncStorage.getItem("user");

      if (!user) {
        setLogado(false);

        //mostrar a mensagem de loading
        setTimeout(() => {
          router.replace("/");
        }, 1500);
      } else {
        setLogado(true);
      }

      setLoading(false);
    }

    checkUser();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000000" }}>
        <ActivityIndicator size="large" color="#D9FF00" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Carregando...</Text>
      </View>
    );
  }

  if (!logado) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000000" }}>
        <Text style={{ color: "#fff", fontSize: 26, textAlign: 'center' }}>
          Você precisa estar logado.
        </Text>
      </View>
    );
  }
  
  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <Stack 
        screenOptions={{ 
          headerShown: false, 
          animation: 'fade',
          contentStyle: { backgroundColor: '#000000' }
        }} 
      />
    </View>
  );
}