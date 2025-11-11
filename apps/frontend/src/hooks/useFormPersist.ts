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

  // Restore data on mount
  useEffect(() => {
    const hasRestoredForThisMetadata =
      restoredMetadataKeysRef.current.has(currentMetadataKey);

    if (!enabled || !getStorage() || hasRestoredForThisMetadata) {
      return;
    }

    const storageInstance = getStorage();
    if (!storageInstance) return;

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
            return;
          }
        }

        // Validate metadata if provided
        if (metadata) {
          // If metadata is required but not present in stored data, reject
          if (!_metadata) {
            clearStorage();
            return;
          }
          // Check if all metadata keys match
          const metadataMatches = Object.keys(metadata).every(
            key => metadata[key] === _metadata[key],
          );
          if (!metadataMatches) {
            // Metadata doesn't match, clear stale data
            clearStorage();
            return;
          }
        }

        // Restore form values
        const dataToRestore: Partial<T> = {};
        const formData = values as Partial<T>;

        Object.keys(formData).forEach(key => {
          const typedKey = key as keyof T;
          if (!exclude.includes(typedKey)) {
            const value = formData[typedKey];
            if (value !== undefined) {
              dataToRestore[typedKey] = value;
              // Cast to Path<T> to satisfy TypeScript - we know these are valid paths
              // since they come from the form data itself
              setValue(typedKey as Path<T>, value as any, {
                shouldValidate: validate,
                shouldDirty: dirty,
                shouldTouch: touch,
              });
            }
          }
        });

        // Use reset if we have data to restore (more reliable for nested structures)
        if (Object.keys(dataToRestore).length > 0) {
          // Mark as restored for this specific metadata key BEFORE any operations
          // This prevents double restoration even if React StrictMode runs effects twice
          restoredMetadataKeysRef.current.add(currentMetadataKey);

          isRestoringRef.current = true;
          reset(dataToRestore as T);

          // Call the callback using the ref to avoid stale closure issues
          onDataRestoredRef.current?.(dataToRestore);
        } else {
          clearStorage();
        }
      } catch (error) {
        // Invalid JSON or corrupted data, clear it
        console.warn('Failed to restore form data:', error);
        clearStorage();
      }
    }
  }, [
    storageKey,
    storage,
    setValue,
    reset,
    exclude,
    validate,
    dirty,
    touch,
    currentMetadataKey,
    timeout,
    onTimeout,
    enabled,
  ]);

  // Persist data when form values change
  useEffect(() => {
    if (!enabled || !getStorage() || isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }

    const storageInstance = getStorage();
    if (!storageInstance) return;

    // Filter out excluded fields
    const valuesToStore = exclude.length
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

    // Only store if there are actual values
    const hasValues = Object.values(valuesToStore).some(
      val => val !== undefined && val !== null && val !== '',
    );

    if (hasValues) {
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
      } catch (error) {
        // Storage quota exceeded or other error
        console.warn('Failed to persist form data:', error);
      }
    } else {
      // No values to store, clear storage
      clearStorage();
    }
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
