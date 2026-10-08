import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, ActivityIndicator, Pressable, Image } from 'react-native';

export interface GameItem {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  downloadUrl: string;
  artworkUrl: string;
}

interface GameListProps {
  searchQuery: string;
  refreshTrigger: number;
  sortMode: SortMode;
  onSortChange: (sortMode: SortMode) => void;
  onSelectGame: (game: GameItem) => void;
}

export type SortMode = 'name' | 'largest' | 'smallest';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const catalogRequests = new Map<string, Promise<CatalogEntry[]>>();

interface CatalogEntry {
  name?: string;
  image?: string;
  uuid?: string;
}

export function GameList({ searchQuery, refreshTrigger, sortMode, onSortChange, onSelectGame }: GameListProps) {
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
            .filter((file: any) => file?.name && file.name.toLowerCase().endsWith('.pkg'))
              .map((file: any, index: number) => {
                const filePath = file.dir && file.dir !== '/' ? `${file.dir}/${file.name}` : file.name;
                
                const exactUrl = `https://archive.org/download/${identifier}/${filePath}`;

                return {
                  id: `bucket-${letter}-${index}-${file.name}`,
                  name: file.name,
                  size: file.size ? formatSize(Number(file.size)) : 'Unknown size',
                  sizeBytes: Number(file.size) || 0,
                  downloadUrl: encodeURI(exactUrl),
                  artworkUrl: '',
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

  const filteredGames = games
    .filter((game) => game.name.toLowerCase().includes((searchQuery || '').toLowerCase()))
    .sort((a, b) => {
      if (sortMode === 'largest') return b.sizeBytes - a.sizeBytes;
      if (sortMode === 'smallest') return a.sizeBytes - b.sizeBytes;
      return a.name.localeCompare(b.name);
    });

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
          <View>
            <View style={styles.listHeader}>
              <View>
                <Text style={styles.sectionHeader}>ARCHIVE INDEX</Text>
                <Text style={styles.resultCount}>{filteredGames.length} of {games.length} packages</Text>
              </View>
              <View style={styles.sortControl}>
                {([
                  ['name', 'A-Z'],
                  ['largest', 'Largest'],
                  ['smallest', 'Smallest'],
                ] as [SortMode, string][]).map(([value, label]) => (
                  <Pressable
                    key={value}
                    style={[styles.sortOption, sortMode === value && styles.sortOptionActive]}
                    onPress={() => onSortChange(value)}
                  >
                    <Text style={[styles.sortText, sortMode === value && styles.sortTextActive]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable 
            style={({ pressed }) => [
              styles.card,
              pressed && { backgroundColor: '#171717', borderColor: '#333333' }
            ]}
            onPress={() => onSelectGame(item)}
          >
            <GameArtwork name={item.name} />
            <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.cardSubtext}>{item.size}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function GameArtwork({ name }: { name: string }) {
  const [imageUrl, setImageUrl] = useState<string>();

  useEffect(() => {
    let active = true;
    findCatalogImage(name).then((url) => {
      if (active) setImageUrl(url);
    });

    return () => { active = false; };
  }, [name]);

  return imageUrl
    ? <Image source={{ uri: imageUrl }} style={styles.artwork} resizeMode="cover" />
    : <View style={[styles.artwork, styles.artworkPlaceholder]}><Text style={styles.placeholderText}>NO ARTWORK</Text></View>;
}

async function findCatalogImage(packageName: string): Promise<string | undefined> {
  const packageId = packageName.match(/\b(?:CUSA|PPSA|PCJS|PLJS)\d{4,}\b/i)?.[0]?.toUpperCase();
  const title = normalizeTitle(packageName);
  const firstLetter = title[0]?.toLowerCase();
  if (!firstLetter || !LETTERS.includes(firstLetter)) return undefined;

  let request = catalogRequests.get(firstLetter);
  if (!request) {
    request = fetch(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/ps4/${firstLetter}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`Catalog request failed with HTTP ${response.status}.`);
        return response.json() as Promise<CatalogEntry[]>;
      });
    catalogRequests.set(firstLetter, request);
  }

  try {
    const entries = await request;
    const idMatch = packageId ? entries.find((entry) => entry.uuid?.toUpperCase().includes(packageId)) : undefined;
    if (idMatch?.image) return idMatch.image;

    const titleMatch = entries.find((entry) => {
      return Boolean(entry.name && normalizeTitle(entry.name) === title && entry.image);
    });
    return titleMatch?.image;
  } catch (error) {
    console.warn('Unable to load PlayStation artwork catalog:', error);
    return undefined;
  }
}

function normalizeTitle(value: string): string {
  return value
    .replace(/\.[^.]+$/, '')
    .replace(/\[[^\]]*]/g, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(?:CUSA|PPSA|PCJS|PLJS)\d{4,}\b/gi, '')
    .replace(/\bv?\d+(?:\.\d+)+\b/gi, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function formatSize(bytes: number): string {
  if (!bytes) return 'Unknown size';
  return bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(2)} GB`
    : `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },
  contentContainer: { padding: 16, paddingTop: 8 },
  columnWrapper: { justifyContent: 'space-between' },
  center: { flex: 1, backgroundColor: '#0b0b0c', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#8d8d92', fontSize: 13, marginTop: 10 },
  listHeader: { marginBottom: 16 },
  sectionHeader: { color: '#d35a86', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  resultCount: { color: '#8d8d92', fontSize: 11, marginTop: 4 },
  sortControl: { flexDirection: 'row', marginTop: 12, gap: 6 },
  sortOption: { borderColor: '#30272c', borderRadius: 6, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 6 },
  sortOptionActive: { backgroundColor: '#241820', borderColor: '#d35a86' },
  sortText: { color: '#8d8d92', fontSize: 10, fontWeight: '700' },
  sortTextActive: { color: '#e9a0bb' },
  card: { 
    width: '48%', 
    backgroundColor: '#121214', 
    padding: 14, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#30272c', 
    marginBottom: 12, 
    justifyContent: 'space-between' 
  },
  artwork: { backgroundColor: '#211b20', borderRadius: 6, height: 92, marginBottom: 12, width: '100%' },
  artworkPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#6f686d', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  cardTitle: { color: '#e8e8eb', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  cardSubtext: { color: '#8d8d92', fontSize: 11 },
});