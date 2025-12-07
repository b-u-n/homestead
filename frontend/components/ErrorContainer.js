import React, { useEffect, useRef } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import ErrorStore from '../stores/ErrorStore';
import ErrorNotification from './ErrorNotification';
import BlockingErrorModal from './BlockingErrorModal';
import SoundManager from '../services/SoundManager';

const ErrorContainer = observer(() => {
  const lastErrorCountRef = useRef(0);

  // Play sound when new errors are added
  useEffect(() => {
    const currentCount = ErrorStore.errorCount;
    if (currentCount > lastErrorCountRef.current) {
      // New error added - play sound
      SoundManager.play('error');
    }
    lastErrorCountRef.current = currentCount;
  }, [ErrorStore.errorCount]);

  // Get the first blocking error (if any)
  const blockingError = ErrorStore.blockingErrors[0];
  const nonBlockingErrors = ErrorStore.nonBlockingErrors;

  return (
    <>
      {/* Non-blocking toast notifications */}
      {nonBlockingErrors.length > 0 && (
        <View style={styles.container} pointerEvents="box-none">
          {nonBlockingErrors.map((error, index) => (
            <ErrorNotification
              key={error.id}
              error={error}
              index={index}
              onDismiss={() => ErrorStore.removeError(error.id)}
            />
          ))}

          {nonBlockingErrors.length >= 2 && (
            <Pressable
              style={[styles.dismissAllButton, { bottom: 20 + (nonBlockingErrors.length * 80) }]}
              onPress={() => ErrorStore.dismissAllNonBlocking()}
            >
              <Text style={styles.dismissAllText}>
                Dismiss All ({nonBlockingErrors.length})
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Blocking error modal */}
      {blockingError && (
        <BlockingErrorModal
          error={blockingError}
          onDismiss={() => ErrorStore.removeError(blockingError.id)}
        />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dismissAllButton: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'rgba(140, 30, 30, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 120, 120, 0.5)',
    zIndex: 1001,
  },
  dismissAllText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Comfortaa',
    fontWeight: '600',
  },
});

export default ErrorContainer;
