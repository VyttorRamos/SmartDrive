import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router, usePathname, Href } from 'expo-router';
import { CircleUserRound, House, ChartArea, FileText, BookUser, AlertTriangle } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function Header() {
  const nomeRota = usePathname();
  const [tipoUsuario, setTipoUsuario] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function carregarTipoUsuario() {
        try {
          const userData = await AsyncStorage.getItem("user");
          if (userData) {
            const user = JSON.parse(userData);
            setTipoUsuario(user.tipo);
          }
        } catch (error) {
          console.log("Erro ao ler tipo de usuário:", error);
        }
      }
      carregarTipoUsuario();
    }, [])
  );

  const caminho = (rota: Href) => {
    router.replace(rota);
  };

  const ehAtivo = (route: string) => nomeRota === route;

  return (
    <View style={styles.bottomBar}>

      {tipoUsuario === 'admin' ? (
        <>
          <TouchableOpacity onPress={() => caminho('/home')} style={styles.iconButton}>
            <View style={[styles.iconWrapper, ehAtivo('/home') && styles.activeIcon]}>
              <House size={24} color={ehAtivo('/home') ? '#000000' : '#ffffff'} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => caminho('/dashboard')} style={styles.iconButton}>
            <View style={[styles.iconWrapper, ehAtivo('/dashboard') && styles.activeIcon]}>
              <ChartArea size={24} color={ehAtivo('/dashboard') ? '#000000' : '#ffffff'} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => caminho('/historico')} style={styles.iconButton}>
            <View style={[styles.iconWrapper, ehAtivo('/historico') && styles.activeIcon]}>
              <FileText size={24} color={ehAtivo('/historico') ? '#000000' : '#ffffff'} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => caminho('/usuarios')} style={styles.iconButton}>
            <View style={[styles.iconWrapper, ehAtivo('/usuarios') && styles.activeIcon]}>
              <BookUser size={24} color={ehAtivo('/usuarios') ? '#000000' : '#ffffff'} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => caminho('/perfil')} style={styles.iconButton}>
            <View style={[styles.iconWrapper, ehAtivo('/perfil') && styles.activeIcon]}>
              <CircleUserRound size={24} color={ehAtivo('/perfil') ? '#000000' : '#ffffff'} />
            </View>
          </TouchableOpacity>
        </>
      ) : (
        <>

          <TouchableOpacity onPress={() => caminho('/dashUser')} style={styles.iconButton}>
            <View style={[styles.iconWrapper, ehAtivo('/dashUser') && styles.activeIcon]}>
              <House size={24} color={ehAtivo('/dashUser') ? '#000000' : '#ffffff'} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => caminho('/historicoUser')} style={styles.iconButton}>
            <View style={[styles.iconWrapper, ehAtivo('/historicoUser') && styles.activeIcon]}>
              <FileText size={24} color={ehAtivo('/historicoUser') ? '#000000' : '#ffffff'} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => caminho('/perfil')} style={styles.iconButton}>
            <View style={[styles.iconWrapper, ehAtivo('/perfil') && styles.activeIcon]}>
              <CircleUserRound size={24} color={ehAtivo('/perfil') ? '#000000' : '#ffffff'} />
            </View>
          </TouchableOpacity>

        </>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#000',
  },
  top: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: '#D9FF00',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    zIndex: 1000,
    elevation: 10,
  },
  iconButton: {
    padding: 1
  },
  iconWrapper: {
    padding: 8,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIcon: {
    backgroundColor: '#D9FF00',
  },
});