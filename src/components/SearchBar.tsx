import { View, StyleSheet, TextInput, Pressable, Text } from "react-native";

interface SearchBarProps {
  value: string;
  onChangeQuery: (text: string) => void;
}

export function SearchBar({ value, onChangeQuery }: SearchBarProps) {
  const handleClear = () => {
    onChangeQuery("");
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search..."
        placeholderTextColor="#525252"
        value={value}
        onChangeText={onChangeQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable 
          style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.7 }]} 
          onPress={handleClear}
        >
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0c1217',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#121d23',
    borderWidth: 1,
    borderColor: '#2a4148',
    borderRadius: 10,
    paddingHorizontal: 16,
    color: '#e6f0ed',
    fontSize: 14,
  },
  clearButton: {
    marginLeft: 8,
    backgroundColor: '#16252c',
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a4148',
  },
  clearText: {
    color: '#9ed9c9',
    fontSize: 12,
    fontWeight: '600',
  },
});