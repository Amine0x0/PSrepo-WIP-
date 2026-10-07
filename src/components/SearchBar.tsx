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
        placeholder="Filter records..."
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
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 42,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    paddingHorizontal: 14,
    color: '#ededed',
    fontSize: 14,
  },
  clearButton: {
    marginLeft: 8,
    backgroundColor: '#171717',
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262626',
  },
  clearText: {
    color: '#a3a3a3',
    fontSize: 12,
    fontWeight: '500',
  },
});