import { useState } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TopBar } from './src/components/TopBar';
import { SearchBar } from './src/components/SearchBar';
import { GameList, GameItem, SortMode } from './src/components/GameList';
import { InstallerTarget } from './src/components/InstallerTarget';
import { getPs4BaseUrl, Ps4Target, sendPackageToPs4 } from './src/installer';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [ps4Target, setPs4Target] = useState<Ps4Target>({ host: '', port: '12800' });
  const [testingConnection, setTestingConnection] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('name');

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectGame = (game: GameItem) => {
    void sendPackage(game);
  };

  const sendPackage = async (game: GameItem) => {
    try {
      await sendPackageToPs4(ps4Target, game.downloadUrl);
      Alert.alert('Install queued', `${game.name} was sent to ${getPs4BaseUrl(ps4Target)}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to contact the PS4.';
      Alert.alert('Install request failed', message);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch(`${getPs4BaseUrl(ps4Target)}/api/is_exists`);
      if (!response.ok) {
        throw new Error(`PS4 returned HTTP ${response.status}.`);
      }
      Alert.alert('PS4 connected', 'Remote PKG Installer is reachable.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to contact the PS4.';
      Alert.alert('Connection failed', `${message}\n\nCheck the IP, port, Wi-Fi network, and that Remote PKG Installer is running.`);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <TopBar onRefresh={handleRefresh} />
        <InstallerTarget
          target={ps4Target}
          onChange={setPs4Target}
          onTest={testConnection}
          testing={testingConnection}
        />
        <SearchBar value={searchQuery} onChangeQuery={setSearchQuery} />
        <GameList
          searchQuery={searchQuery}
          refreshTrigger={refreshTrigger}
          sortMode={sortMode}
          onSortChange={setSortMode}
          onSelectGame={handleSelectGame}
        />
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});