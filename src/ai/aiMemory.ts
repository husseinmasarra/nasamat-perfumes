/**
 * AI Memory & Context Persistence Module
 * Level 4: Maintains conversational memory and user preferences
 */

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  recommendations?: any[];
  skillsInvoked?: string[];
}

export interface UserScentPreferences {
  favoriteFamilies: string[];
  preferredGender?: 'men' | 'women' | 'unisex';
  preferredNotes: string[];
  budgetUsdMax?: number;
  lastRecommendedIds: string[];
}

const MEMORY_STORAGE_KEY = 'nasamat_ai_sommelier_memory_v1';

export class AiMemory {
  private messages: ChatMessage[] = [];
  private preferences: UserScentPreferences = {
    favoriteFamilies: [],
    preferredNotes: [],
    lastRecommendedIds: [],
  };

  constructor() {
    this.loadFromStorage();
  }

  public getMessages(): ChatMessage[] {
    return this.messages;
  }

  public addMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
    };
    this.messages.push(newMsg);

    // Keep context window within token bounds (last 20 messages)
    if (this.messages.length > 20) {
      this.messages = this.messages.slice(-20);
    }

    this.saveToStorage();
    return newMsg;
  }

  public updatePreferences(newPrefs: Partial<UserScentPreferences>) {
    this.preferences = {
      ...this.preferences,
      ...newPrefs,
    };
    this.saveToStorage();
  }

  public getPreferences(): UserScentPreferences {
    return this.preferences;
  }

  public clear() {
    this.messages = [];
    this.preferences = {
      favoriteFamilies: [],
      preferredNotes: [],
      lastRecommendedIds: [],
    };
    try {
      localStorage.removeItem(MEMORY_STORAGE_KEY);
    } catch (_) {}
  }

  private saveToStorage() {
    try {
      localStorage.setItem(
        MEMORY_STORAGE_KEY,
        JSON.stringify({
          messages: this.messages,
          preferences: this.preferences,
        })
      );
    } catch (_) {}
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.messages)) {
          this.messages = parsed.messages;
        }
        if (parsed.preferences) {
          this.preferences = parsed.preferences;
        }
      }
    } catch (_) {}
  }
}
