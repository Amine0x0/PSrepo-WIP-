import { View, StyleSheet, Text, Pressable } from "react-native";

interface TopBarProps {
  onRefresh: () => void;
}

export function TopBar({ onRefresh }: TopBarProps) {
  return (
    <View style={styles.topBar}>
      <View>
        <Text style={styles.kicker}>@lowtix</Text>
        <Text style={styles.title}>PS4Repo</Text>
      </View>
      
      <Pressable 
        style={({ pressed }) => [
          styles.refreshButton,
          pressed && { backgroundColor: '#262626' }
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
    borderBottomWidth: 1,
    borderBottomColor: '#2a2528',
  },
  title: {
    color: '#ededee',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  kicker: {
    color: '#d35a86',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  refreshButton: {
    backgroundColor: '#21191e',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#9f4969',
  },
  refreshText: {
    color: '#e09ab5',
    fontSize: 13,
    fontWeight: '500',
  },
});