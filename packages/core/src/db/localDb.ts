import AsyncStorage from '@react-native-async-storage/async-storage';

function storageKey(collection: string) {
  return `fan-sim:collection:${collection}`;
}

async function readCollection<T>(collection: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(storageKey(collection));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeCollection<T>(collection: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(storageKey(collection), JSON.stringify(items));
}

export function createCollection<T extends { id: string }>(name: string) {
  return {
    async all(): Promise<T[]> {
      return readCollection<T>(name);
    },
    async insert(item: T): Promise<T> {
      const items = await readCollection<T>(name);
      items.unshift(item);
      await writeCollection(name, items);
      return item;
    },
    async remove(id: string): Promise<void> {
      const items = await readCollection<T>(name);
      await writeCollection(
        name,
        items.filter((it) => it.id !== id)
      );
    },
  };
}
