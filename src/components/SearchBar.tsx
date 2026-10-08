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
    paddingVertical: 18,
    backgroundColor: '#0b0b0c',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: '#121214',
    borderWidth: 1.5,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    paddingHorizontal: 16,
    color: '#ededee',
    fontSize: 14,
  },
  clearButton: {
    marginLeft: 8,
    backgroundColor: '#171717',
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#f2f2f2',
  },
  clearText: {
    color: '#f2f2f2',
    fontSize: 12,
    fontWeight: '600',
  },
});