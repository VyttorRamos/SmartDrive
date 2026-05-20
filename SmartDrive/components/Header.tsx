import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router, usePathname, Href } from 'expo-router';
import { CircleUserRound, House, ChartArea, FileText, BookUser } from 'lucide-react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function Header({ ocultar = false }: { ocultar?: boolean }) {
  const nomeRota = usePathname();
  const [tipoUsuario, setTipoUsuario] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: ocultar ? 120 : 0, 
      duration: 300, 
      useNativeDriver: true,
    }).start();
  }, [ocultar]);

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
    <Animated.View style={[styles.bottomBar, { transform: [{ translateY }] }]}>

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

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    zIndex: 1000,
    elevation: 10,
  },
  iconButton: {
    padding: 2,
  },
  iconWrapper: {
    width: 50, 
    height: 50,
    borderRadius: 25, 
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', 
  },
  activeIcon: {
    backgroundColor: '#D9FF00',
  },
});