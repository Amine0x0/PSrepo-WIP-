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
  });
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
      const response = await sendPackageToPs4(ps4Target, game.downloadUrl);
      Alert.alert('PS4 response', `${game.name} was sent to ${getPs4BaseUrl(ps4Target)}.\n\n${formatPs4Response(response)}`);
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
      const response = await sendPackageToPs4(ps4Target, url);
      Alert.alert('PS4 response', formatPs4Response(response));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to contact the PS4.';
      Alert.alert('Install request failed', message);
    } finally {
      setInstallingUrl(false);
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <TopBar onRefresh={handleRefresh} />
        <InstallerTarget
          target={ps4Target}
          onChange={setPs4Target}
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

function formatPs4Response(response: { status: number; statusText: string; body: string }): string {
  const status = `${response.status}${response.statusText ? ` ${response.statusText}` : ''}`;
  return `HTTP ${status}\n${response.body || '[empty response body]'}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});