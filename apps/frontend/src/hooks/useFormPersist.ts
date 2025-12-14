import {useEffect, useRef} from 'react';
import {
  UseFormWatch,
  UseFormSetValue,
  UseFormReset,
  Path,
} from 'react-hook-form';

export interface FormPersistConfig<T extends Record<string, any>> {
  /** Storage to use - defaults to localStorage */
  storage?: Storage;
  /** Function to watch form values */
  watch: UseFormWatch<T>;
  /** Function to set form values */
  setValue: UseFormSetValue<T>;
  /** Function to reset the form */
  reset: UseFormReset<T>;
  /** Fields to exclude from persistence */
  exclude?: (keyof T)[];
  /** Callback when data is restored */
  onDataRestored?: (data: Partial<T>) => void;
  /** Whether to validate when restoring */
  validate?: boolean;
  /** Whether to mark fields as dirty when restoring */
  dirty?: boolean;
  /** Whether to mark fields as touched when restoring */
  touch?: boolean;
  /** Optional metadata to validate against stored data */
  metadata?: Record<string, any>;
  /** Optional timeout in milliseconds - data older than this will be cleared */
  timeout?: number;
  /** Callback when data expires */
  onTimeout?: () => void;
  /** Whether to enable persistence - defaults to true */
  enabled?: boolean;
}

/**
 * Hook to persist form data to storage and restore it on mount.
 * Useful for preserving form state across page navigation or authentication flows.
 *
 * @example
 * ```tsx
 * const form = useForm<MyFormData>({...});
 * useFormPersist('my-form-key', {
 *   watch: form.watch,
 *   setValue: form.setValue,
 *   reset: form.reset,
 *   metadata: { eventId: '123' },
 *   onDataRestored: (data) => {
 *     toast.info('Form data restored');
 *   },
 * });
 * ```
 */
export const useFormPersist = <T extends Record<string, any>>(
  storageKey: string,
  {
    storage = typeof window !== 'undefined' ? window.localStorage : undefined,
    watch,
    setValue,
    reset,
    exclude = [],
    onDataRestored,
    validate = false,
    dirty = false,
    touch = false,
    metadata,
    timeout,
    onTimeout,
    enabled = true,
  }: FormPersistConfig<T>,
) => {
  const watchedValues = watch();
  const isRestoringRef = useRef(false);
  const isSavingRef = useRef(false);
  const initializedRef = useRef(false);
  const lastValuesRef = useRef<Record<string, unknown>>({});
  // Track restoration per metadataKey to prevent double restoration
  const restoredMetadataKeysRef = useRef<Set<string>>(new Set());
  // Store callback in ref to prevent effect re-runs when callback reference changes
  const onDataRestoredRef = useRef(onDataRestored);

  // Get storage instance - returns undefined if not available
  const getStorage = () => {
    if (typeof window === 'undefined') return undefined;
    return storage || window.localStorage;
  };

  const clearStorage = () => {
    const storageInstance = getStorage();
    if (storageInstance) {
      storageInstance.removeItem(storageKey);
    }
  };

  // Create a metadata key for comparison
  const metadataKey = metadata ? JSON.stringify(metadata) : null;
  const currentMetadataKey = metadataKey || 'no-metadata';

  // Update callback ref when it changes
  useEffect(() => {
    onDataRestoredRef.current = onDataRestored;
  }, [onDataRestored]);

  // Helper to check if values have changed
  const valuesHaveChanged = (newValues: Record<string, unknown>): boolean => {
    const lastValues = lastValuesRef.current;

    const newKeys = Object.keys(newValues).sort();
    const lastKeys = Object.keys(lastValues).sort();

    if (
      newKeys.length !== lastKeys.length ||
      !newKeys.every((key, i) => key === lastKeys[i])
    ) {
      return true;
    }

    return newKeys.some(
      key => JSON.stringify(newValues[key]) !== JSON.stringify(lastValues[key]),
    );
  };

  // Restore data on mount (only once)
  useEffect(() => {
    // Only restore once, and not if already restoring
    if (
      initializedRef.current ||
      isRestoringRef.current ||
      !enabled ||
      !getStorage()
    ) {
      return;
    }

    const hasRestoredForThisMetadata =
      restoredMetadataKeysRef.current.has(currentMetadataKey);

    if (hasRestoredForThisMetadata) {
      initializedRef.current = true;
      return;
    }

    isRestoringRef.current = true;

    const storageInstance = getStorage();
    if (!storageInstance) {
      isRestoringRef.current = false;
      initializedRef.current = true;
      return;
    }

    const storedData = storageInstance.getItem(storageKey);

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        const {_timestamp, _metadata, ...values} = parsed;

        // Check timeout if provided
        if (timeout && _timestamp) {
          const now = Date.now();
          const age = now - _timestamp;
          if (age > timeout) {
            onTimeout?.();
            clearStorage();
            isRestoringRef.current = false;
            initializedRef.current = true;
            return;
          }
        }

        // Validate metadata if provided
        if (metadata) {
          // If metadata is required but not present in stored data, reject
          if (!_metadata) {
            clearStorage();
            isRestoringRef.current = false;
            initializedRef.current = true;
            return;
          }
          // Check if all metadata keys match
          const metadataMatches = Object.keys(metadata).every(
            key => metadata[key] === _metadata[key],
          );
          if (!metadataMatches) {
            // Metadata doesn't match, clear stale data
            clearStorage();
            isRestoringRef.current = false;
            initializedRef.current = true;
            return;
          }
        }

        // Restore form values
        const dataToRestore: Partial<T> = {};
        const formData = values as Partial<T>;

        Object.keys(formData).forEach(key => {
          const typedKey = key as keyof T;
          if (!exclude.includes(typedKey)) {
            const storedValue = formData[typedKey];
            if (storedValue !== undefined) {
              dataToRestore[typedKey] = storedValue;
            }
          }
        });

        // Only restore if we have data to restore
        if (Object.keys(dataToRestore).length > 0) {
          // Mark as restored for this specific metadata key
          restoredMetadataKeysRef.current.add(currentMetadataKey);

          // Store last values to prevent unnecessary saves
          lastValuesRef.current = structuredClone(dataToRestore) as Record<
            string,
            unknown
          >;

          reset(dataToRestore as T);

          // Call callback since we're actually restoring data
          onDataRestoredRef.current?.(dataToRestore);
        } else {
          // No data to restore, mark as restored to prevent future attempts
          restoredMetadataKeysRef.current.add(currentMetadataKey);
        }
      } catch (error) {
        // Invalid JSON or corrupted data, clear it
        console.warn('Failed to restore form data:', error);
        clearStorage();
      }
    }

    isRestoringRef.current = false;
    initializedRef.current = true;
  }, [
    storageKey,
    storage,
    reset,
    exclude,
    currentMetadataKey,
    timeout,
    onTimeout,
    enabled,
    metadata,
  ]);

  // Persist data when form values change
  useEffect(() => {
    // Don't save if restoring, not initialized, or already saving
    if (
      !enabled ||
      !getStorage() ||
      isRestoringRef.current ||
      !initializedRef.current ||
      isSavingRef.current
    ) {
      return;
    }

    const storageInstance = getStorage();
    if (!storageInstance) return;

    isSavingRef.current = true;

    // Filter out excluded fields
    const valuesToStore: Record<string, any> = exclude.length
      ? (Object.entries(watchedValues) as [keyof T, any][])
          .filter(([key]) => !exclude.includes(key))
          .reduce(
            (obj, [key, val]) => {
              obj[key as string] = val;
              return obj;
            },
            {} as Record<string, any>,
          )
      : {...watchedValues};

    // Only store if there are actual values and they've changed
    const hasValues = Object.values(valuesToStore).some(
      val => val !== undefined && val !== null && val !== '',
    );

    if (hasValues && valuesHaveChanged(valuesToStore)) {
      const dataToStore: Record<string, any> = {
        ...valuesToStore,
      };

      // Add metadata if provided
      if (metadata) {
        dataToStore._metadata = metadata;
      }

      // Add timestamp if timeout is provided
      if (timeout !== undefined) {
        dataToStore._timestamp = Date.now();
      }

      try {
        storageInstance.setItem(storageKey, JSON.stringify(dataToStore));
        // Update last saved values
        lastValuesRef.current = structuredClone(valuesToStore);
      } catch (error) {
        // Storage quota exceeded or other error
        console.warn('Failed to persist form data:', error);
      }
    } else if (!hasValues) {
      // No values to store, clear storage
      clearStorage();
      lastValuesRef.current = {};
    }

    isSavingRef.current = false;
  }, [watchedValues, storageKey, storage, exclude, metadata, timeout, enabled]);

  return {
    /** Clear the persisted data */
    clear: clearStorage,
    /** Check if data exists in storage */
    hasData: () => {
      const storageInstance = getStorage();
      return storageInstance?.getItem(storageKey) !== null;
    },
  };
};
