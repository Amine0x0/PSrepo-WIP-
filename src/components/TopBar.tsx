import { View, StyleSheet, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TopBarProps {
  onRefresh: () => void;
}

export function TopBar({ onRefresh }: TopBarProps) {
  const { top } = useSafeAreaInsets();

  return (
    <View style={[styles.topBar, { height: styles.topBar.height + top, paddingTop: styles.topBar.paddingTop + top }]}>
      <View>
        <Text style={styles.kicker}>@lowtix</Text>
        <Text style={styles.title}>PS4Repo</Text>
      </View>
      
      <Pressable 
        style={({ pressed }) => [
          styles.refreshButton,
          pressed && styles.pressed
        ]} 
        onPress={onRefresh}
      >
        <Text style={styles.refreshText}>Refresh</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 64,
    backgroundColor: '#111112',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#f2f2f2',
  },
  title: {
    color: '#ededee',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  kicker: {
    color: '#b8b8b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 5,
  },
  refreshButton: {
    backgroundColor: '#171717',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#f2f2f2',
  },
  refreshText: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    backgroundColor: '#303030',
  },
});