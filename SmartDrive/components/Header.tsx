import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname, Href } from 'expo-router';
import { CircleUserRound, House, ChartArea, FileText, BookUser } from 'lucide-react-native';

export default function Header() {
  const nomeRota = usePathname(); // pega a rota atual

  //o Expo Router não aceita string como argumento e por isso precisa utilizar o Href
  const caminho = (rota: Href) => {
    router.replace(rota);
  };

  const ehAtivo = (route: string) => nomeRota === route;

  return (
    <>
      {/* <SafeAreaView style={styles.safeArea}>
        <View style={styles.top}>
          <Text style={styles.title}>SmartDrive</Text>
          <TouchableOpacity onPress={() => navigateTo('/perfil')}>
            <CircleUserRound color="#ffffff" size={24} />
          </TouchableOpacity>
        </View>
      </SafeAreaView> */}

      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={() => caminho('/home')} style={styles.iconButton}>
          <View style={[styles.iconWrapper, ehAtivo('/home') && styles.activeIcon]}>
            <House 
              size={24} 
              color={ehAtivo('/home') ? '#000000' : '#ffffff'} 
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => caminho('/dashboard')} style={styles.iconButton}>
          <View style={[styles.iconWrapper, ehAtivo('/dashboard') && styles.activeIcon]}>
            <ChartArea 
              size={24} 
              color={ehAtivo('/dashboard') ? '#000000' : '#ffffff'} 
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => caminho('/historico')} style={styles.iconButton}>
          <View style={[styles.iconWrapper, ehAtivo('/historico') && styles.activeIcon]}>
            <FileText 
              size={24} 
              color={ehAtivo('/historico') ? '#000000' : '#ffffff'} 
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => caminho('/usuarios')} style={styles.iconButton}>
          <View style={[styles.iconWrapper, ehAtivo('/usuarios') && styles.activeIcon]}>
            <BookUser 
              size={24} 
              color={ehAtivo('/usuarios') ? '#000000' : '#ffffff'} 
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => caminho('/perfil')} style={styles.iconButton}>
          <View style={[styles.iconWrapper, ehAtivo('/perfil') && styles.activeIcon]}>
            <CircleUserRound 
              size={24} 
              color={ehAtivo('/perfil') ? '#000000' : '#ffffff'} 
            />
          </View>
        </TouchableOpacity>
      </View>
    </>
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