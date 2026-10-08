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
    borderBottomWidth: 1.5,
    borderBottomColor: '#f2f2f2',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#f2f2f2',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  endpoint: {
    color: '#ededee',
    fontSize: 12,
    marginTop: 4,
  },
  toggle: {
    color: '#f2f2f2',
    fontSize: 12,
    fontWeight: '600',
  },
  editor: {
    marginTop: 16,
  },
  help: {
    color: '#737373',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  inputs: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    backgroundColor: '#121214',
    borderColor: '#f2f2f2',
    borderRadius: 10,
    borderWidth: 1.5,
    color: '#ededee',
    height: 48,
    paddingHorizontal: 14,
  },
  hostInput: {
    flex: 1,
  },
  portInput: {
    width: 96,
  },
  testButton: {
    alignItems: 'center',
    backgroundColor: '#171717',
    borderColor: '#f2f2f2',
    borderRadius: 10,
    borderWidth: 1.5,
    marginTop: 14,
    paddingVertical: 13,
  },
  pressed: {
    opacity: 0.7,
  },
  testText: {
    color: '#f2f2f2',
    fontSize: 12,
    fontWeight: '600',
  },
});
