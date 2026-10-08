import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TopBar } from './src/components/TopBar';
import { SearchBar } from './src/components/SearchBar';
import { GameList, GameItem, SortMode } from './src/components/GameList';
import { InstallerTarget } from './src/components/InstallerTarget';
import { getPs4BaseUrl, Ps4Target, sendPackageToPs4 } from './src/installer';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [ps4Target, setPs4Target] = useState<Ps4Target>({
    host: '',
    port: '12800',
    titleId: 'CUSA01116',
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [installingUrl, setInstallingUrl] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('name');

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectGame = (game: GameItem) => {
    void sendPackage(game);
  };

  const sendPackage = async (game: GameItem) => {
    setInstallingUrl(true);
    try {
      await sendPackageToPs4(ps4Target, game.downloadUrl);
      Alert.alert('Install queued', `${game.name} was sent to ${getPs4BaseUrl(ps4Target)}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to contact the PS4.';
      Alert.alert('Install request failed', message);
    } finally {
      setInstallingUrl(false);
    }
  };

  const installUrl = async (url: string) => {
    setInstallingUrl(true);
    try {
      await sendPackageToPs4(ps4Target, url);
      Alert.alert('Install queued', 'The PS4 accepted the install request.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to contact the PS4.';
      Alert.alert('Install request failed', message);
    } finally {
      setInstallingUrl(false);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const titleId = ps4Target.titleId.trim().toUpperCase();
      if (!/^CUSA\d{5}$/.test(titleId)) {
        throw new Error('Enter a real CUSA title ID before checking whether that game is installed.');
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      let response: Response;
      try {
        response = await fetch(`${getPs4BaseUrl(ps4Target)}/api/is_exists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: JSON.stringify({ title_id: titleId }),
          signal: controller.signal,
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('The PS4 did not respond within 15 seconds.');
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
      if (!response.ok) {
        throw new Error(`PS4 returned HTTP ${response.status}.`);
      }
      const result = (await response.json()) as { exists?: boolean; size?: number };
      Alert.alert(
        'Title lookup complete',
        result.exists ? `${titleId} is installed on the PS4.` : `${titleId} is not installed on the PS4.`,
      );
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
          onInstallUrl={installUrl}
          installingUrl={installingUrl}
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