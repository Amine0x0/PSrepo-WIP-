import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ps4Target, getPs4BaseUrl } from '../installer';

interface InstallerTargetProps {
  target: Ps4Target;
  onChange: (target: Ps4Target) => void;
  onInstallUrl: (url: string) => Promise<void>;
  installingUrl: boolean;
}

export function InstallerTarget({
  target,
  onChange,
  onInstallUrl,
  installingUrl,
}: InstallerTargetProps) {
  const [expanded, setExpanded] = useState(false);
  const [url, setUrl] = useState('');
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        expanded ? styles.expandedContainer : styles.collapsedContainer,
        { bottom: expanded ? 0 : bottom + 16 },
      ]}
    >
      {!expanded ? (
        <Pressable style={({ pressed }) => [styles.configureButton, pressed && styles.pressed]} onPress={() => setExpanded(true)}>
          <Text style={styles.configureText}>PS4 setup</Text>
        </Pressable>
      ) : (
        <View>
          <View style={styles.header}>
            <View>
              <Text style={styles.label}>PS4 CONNECTION</Text>
              <Text style={styles.endpoint}>{getEndpointLabel(target)}</Text>
            </View>
            <Pressable onPress={() => setExpanded(false)} hitSlop={12}>
              <Text style={styles.close}>Done</Text>
            </Pressable>
          </View>
          <View style={styles.editor}>
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
          <TextInput
            style={styles.urlInput}
            value={url}
            onChangeText={setUrl}
            placeholder="Package (.pkg) or manifest (.json) URL"
            placeholderTextColor="#525252"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Pressable
            style={({ pressed }) => [styles.installButton, pressed && styles.pressed]}
            onPress={() => void onInstallUrl(url)}
            disabled={installingUrl || !url.trim()}
          >
            <Text style={styles.installText}>
              {installingUrl ? 'Sending...' : 'Install from URL'}
            </Text>
          </Pressable>
          </View>
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
    position: 'absolute',
    zIndex: 10,
  },
  collapsedContainer: {
    right: 16,
    width: 112,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  expandedContainer: {
    left: 16,
    right: 16,
    backgroundColor: '#142127',
    borderColor: '#2a4148',
    borderRadius: 16,
    borderWidth: 1,
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  configureButton: {
    alignItems: 'center',
    backgroundColor: '#21443f',
    borderColor: '#76b9a7',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  configureText: {
    color: '#d7f1e8',
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#d7f1e8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  endpoint: {
    color: '#91a7a5',
    fontSize: 12,
    marginTop: 4,
  },
  close: {
    color: '#9ed9c9',
    fontSize: 12,
    fontWeight: '600',
  },
  editor: {
    marginTop: 16,
  },
  inputs: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    backgroundColor: '#0f1a20',
    borderColor: '#2a4148',
    borderRadius: 10,
    borderWidth: 1,
    color: '#e6f0ed',
    height: 48,
    paddingHorizontal: 14,
  },
  hostInput: {
    flex: 1,
  },
  portInput: {
    width: 96,
  },
  pressed: {
    opacity: 0.7,
  },
  urlInput: {
    backgroundColor: '#0f1a20',
    borderColor: '#2a4148',
    borderRadius: 10,
    borderWidth: 1,
    color: '#e6f0ed',
    height: 48,
    marginTop: 14,
    paddingHorizontal: 14,
  },
  installButton: {
    alignItems: 'center',
    backgroundColor: '#9ed9c9',
    borderRadius: 10,
    marginTop: 10,
    paddingVertical: 13,
  },
  installText: {
    color: '#10201f',
    fontSize: 12,
    fontWeight: '700',
  },
});
