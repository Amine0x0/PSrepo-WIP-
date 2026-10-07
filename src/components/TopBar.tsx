import { View, StyleSheet, Text, Pressable } from "react-native";

interface TopBarProps {
  onRefresh: () => void;
}

export function TopBar({ onRefresh }: TopBarProps) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.title}>@TBONMK</Text>
      
      <Pressable 
        style={({ pressed }) => [
          styles.refreshButton,
          pressed && { backgroundColor: '#262626' }
        ]} 
        onPress={onRefresh}
      >
        <Text style={styles.refreshText}>Sync</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 64,
    backgroundColor: '#0a0a0a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  title: {
    color: '#ededed',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  refreshButton: {
    backgroundColor: '#171717',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
  },
  refreshText: {
    color: '#a3a3a3',
    fontSize: 13,
    fontWeight: '500',
  },
});