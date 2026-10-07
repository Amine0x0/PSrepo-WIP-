import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';

export interface GameItem {
  id: string;
  name: string;
  size: string;
  downloadUrl: string;
}

interface GameListProps {
  searchQuery: string;
  refreshTrigger: number;
  onSelectGame: (game: GameItem) => void;
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

export function GameList({ searchQuery, refreshTrigger, onSelectGame }: GameListProps) {
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllBuckets = useCallback(async () => {
    setLoading(true);
    try {
      const promises = LETTERS.map(async (letter) => {
        const identifier = `ps4-fpkg-collection-english-${letter}`;
        try {
          const response = await fetch(`https://archive.org/metadata/${identifier}`);
          const data = await response.json();

          if (data?.files) {
            return data.files
              .filter((file: any) => 
                file?.name && (file.name.endsWith('.pkg') || file.name.endsWith('.zip') || file.name.endsWith('.rar'))
              )
              .map((file: any, index: number) => {
                const filePath = file.dir && file.dir !== '/' ? `${file.dir}/${file.name}` : file.name;
                
                const exactUrl = `https://archive.org/download/${identifier}/${filePath}`;

                return {
                  id: `bucket-${letter}-${index}-${file.name}`,
                  name: file.name,
                  size: file.size ? (file.size / (1024 * 1024 * 1024)).toFixed(2) + ' GB' : 'Unknown size',
                  downloadUrl: encodeURI(exactUrl),
                };
              });
          }
        } catch {
        }
        return [];
      });

      const results = await Promise.all(promises);
      setGames(results.flat());
    } catch (error) {
      console.error('Failed to load archive buckets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllBuckets();
  }, [refreshTrigger, fetchAllBuckets]);

  const filteredGames = games.filter((game) =>
    game.name.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#ededed" />
        <Text style={styles.loadingText}>Syncing archive buckets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredGames}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.contentContainer}
        ListHeaderComponent={
          <Text style={styles.sectionHeader}>
            Archive Index ({filteredGames.length} / {games.length} items)
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable 
            style={({ pressed }) => [
              styles.card,
              pressed && { backgroundColor: '#171717', borderColor: '#333333' }
            ]}
            onPress={() => onSelectGame(item)}
          >
            <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.cardSubtext}>{item.size}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  contentContainer: { padding: 16 },
  columnWrapper: { justifyContent: 'space-between' },
  center: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#737373', fontSize: 13, marginTop: 10 },
  sectionHeader: { color: '#525252', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14 },
  card: { 
    width: '48%', 
    backgroundColor: '#0f0f0f', 
    padding: 14, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#222222', 
    marginBottom: 12, 
    justifyContent: 'space-between' 
  },
  cardTitle: { color: '#ededed', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  cardSubtext: { color: '#737373', fontSize: 11 },
});