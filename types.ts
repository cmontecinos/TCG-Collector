
export interface MylCard {
  // Master ID (e.g. "Hidalgo-Guerrero-Jaguar")
  id: string; 
  name: string;
  edition: string;
  type: string;
  rarity?: string;
  ability?: string;
  strength?: number;
  cost?: number;
  race?: string;
  imageUrl?: string;
  sourceUrl?: string;
  metadataFetched: boolean;
}

export interface UserCollectionItem {
  id: string; // Unique ID for this specific instance in user library
  cardId: string; // Reference to the Master Catalog id
  dateAdded: number;
  notes?: string;
}

export type ScanResult = Pick<MylCard, 'name' | 'edition' | 'type'>;

export interface AppState {
  catalog: MylCard[];
  library: UserCollectionItem[];
}
