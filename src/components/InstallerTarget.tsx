import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ps4Target, getPs4BaseUrl } from '../installer';

interface InstallerTargetProps {
  target: Ps4Target;
  onChange: (target: Ps4Target) => void;
  onTest: () => Promise<void>;
  testing: boolean;
}

export function InstallerTarget({ target, onChange, onTest, testing }: InstallerTargetProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setExpanded((value) => !value)}>
        <View>
          <Text style={styles.label}>PS4 REMOTE PKG INSTALLER</Text>
          <Text style={styles.endpoint}>{getEndpointLabel(target)}</Text>
        </View>
        <Text style={styles.toggle}>{expanded ? 'Hide' : 'Configure'}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.editor}>
          <Text style={styles.help}>
            The PS4 must be on the same network with Remote PKG Installer running.
          </Text>
          <View style={styles.inputs}>
            <TextInput
              style={[styles.input, styles.hostInput]}
              value={target.host}
              onChangeText={(host) => onChange({ ...target, host })}
              placeholder="PS4 IP address"
              placeholderTextColor="#525252"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TextInput
              style={[styles.input, styles.portInput]}
              value={target.port}
              onChangeText={(port) => onChange({ ...target, port })}
              placeholder="12800"
              placeholderTextColor="#525252"
              keyboardType="number-pad"
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.testButton, pressed && styles.pressed]}
            onPress={onTest}
            disabled={testing}
          >
            <Text style={styles.testText}>{testing ? 'Checking...' : 'Test PS4 connection'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function getEndpointLabel(target: Ps4Target): string {
  try {
    return `${getPs4BaseUrl(target)}/api/install`;
  } catch {
    return 'Set the PS4 address and port';
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111112',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2528',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#d35a86',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  endpoint: {
    color: '#ededee',
    fontSize: 12,
    marginTop: 4,
  },
  toggle: {
    color: '#e09ab5',
    fontSize: 12,
  },
  editor: {
    marginTop: 12,
  },
  help: {
    color: '#737373',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  inputs: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: '#121214',
    borderColor: '#30272c',
    borderRadius: 8,
    borderWidth: 1,
    color: '#ededee',
    height: 42,
    paddingHorizontal: 12,
  },
  hostInput: {
    flex: 1,
  },
  portInput: {
    width: 90,
  },
  testButton: {
    alignItems: 'center',
    backgroundColor: '#21191e',
    borderColor: '#9f4969',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  testText: {
    color: '#e09ab5',
    fontSize: 12,
    fontWeight: '600',
  },
});
