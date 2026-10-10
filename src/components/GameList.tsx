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
                const pathSegments = [
                  ...(file.dir && file.dir !== '/' ? file.dir.split('/').filter(Boolean) : []),
                  file.name,
                ];
                const exactUrl = `https://archive.org/download/${identifier}/${pathSegments
                  .map((segment: string) => encodeURIComponent(segment))
                  .join('/')}`;

                return {
                  id: `bucket-${letter}-${index}-${file.name}`,
                  name: file.name,
                  size: file.size ? formatSize(Number(file.size)) : 'Unknown size',
                  sizeBytes: Number(file.size) || 0,
                  downloadUrl: exactUrl,
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
        <Text style={styles.loadingText}>Loading games...</Text>
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
                <Text style={styles.sectionHeader}>Games</Text>
                <Text style={styles.resultCount}>{filteredGames.length} games</Text>
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
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let active = true;
    findCatalogImage(name).then((url) => {
      if (active) setImageUrl(url);
    });

    return () => { active = false; };
  }, [name]);

  if (imageUrl && !imageFailed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.artwork}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <Image
      source={require('../../assets/placeholder-cover.png')}
      style={styles.artwork}
      resizeMode="cover"
      accessibilityLabel="Placeholder cover artwork"
    />
  );
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
  container: { flex: 1, backgroundColor: '#0c1217' },
  contentContainer: { padding: 20, paddingTop: 10, paddingBottom: 28 },
  columnWrapper: { justifyContent: 'space-between', gap: 12 },
  center: { flex: 1, backgroundColor: '#0c1217', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#91a7a5', fontSize: 13, marginTop: 10 },
  listHeader: { marginBottom: 18 },
  sectionHeader: { color: '#e6f0ed', fontSize: 17, fontWeight: '700' },
  resultCount: { color: '#91a7a5', fontSize: 12, marginTop: 5 },
  sortControl: { flexDirection: 'row', marginTop: 16, gap: 8 },
  sortOption: { backgroundColor: '#121d23', borderColor: '#2a4148', borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  sortOptionActive: { backgroundColor: '#21443f', borderColor: '#76b9a7' },
  sortText: { color: '#91a7a5', fontSize: 11, fontWeight: '700' },
  sortTextActive: { color: '#d7f1e8' },
  card: { 
    width: '48%', 
    backgroundColor: '#121d23',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#263b43',
    marginBottom: 16,
    justifyContent: 'space-between' 
  },
  artwork: { backgroundColor: '#1b2a30', borderRadius: 7, height: 112, marginBottom: 12, width: '100%' },
  cardTitle: { color: '#e6f0ed', fontSize: 14, fontWeight: '700', lineHeight: 19, marginBottom: 8 },
  cardSubtext: { color: '#91a7a5', fontSize: 12 },
});