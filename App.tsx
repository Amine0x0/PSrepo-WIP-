import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { TopBar } from './src/components/TopBar';
import { SearchBar } from './src/components/SearchBar';
import { GameList, GameItem } from './src/components/GameList';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectGame = (game: GameItem) => {
    console.log('Selected Game:', game.name);
    console.log('Captured Download URL:', game.downloadUrl);
  };

  return (
    <View style={styles.container}>
      <TopBar onRefresh={handleRefresh} />
      <SearchBar value={searchQuery} onChangeQuery={setSearchQuery} />
      <GameList 
        searchQuery={searchQuery} 
        refreshTrigger={refreshTrigger} 
        onSelectGame={handleSelectGame} 
      />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});