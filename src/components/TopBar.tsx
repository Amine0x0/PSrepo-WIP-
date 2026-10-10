import { View, StyleSheet, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TopBarProps {
  onRefresh: () => void;
}

export function TopBar({ onRefresh }: TopBarProps) {
  const { top } = useSafeAreaInsets();

  return (
    <View style={[styles.topBar, { height: styles.topBar.height + top, paddingTop: styles.topBar.paddingTop + top }]}>
      <Text style={styles.title}>PS4Repo</Text>
      
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
    backgroundColor: '#0c1217',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#203039',
  },
  title: {
    color: '#e6f0ed',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  refreshButton: {
    backgroundColor: '#16252c',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  refreshText: {
    color: '#9ed9c9',
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    backgroundColor: '#213740',
  },
});