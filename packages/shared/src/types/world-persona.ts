import type { PersonaEntry } from "./persona-entries.js";

export interface PersonaCustomEntry {
  title?: string;
  content?: string;
}

export interface NpcEntryFields {
  id: string;
  name: string;
  content: string;
  role: string;
  apiRole?: string;
  section?: string;
  position?: number;
  enabled?: boolean;
  alwaysSend?: boolean;
  keywords?: string[];
  conditions?: any[];
  conditionLogic?: string;
  depth?: number;
  matchWholeWords?: boolean;
  secondaryKeywords?: string[];
  secondaryKeywordLogic?: string;
  preventRecursion?: boolean;
  excludeRecursion?: boolean;
  tags?: string[];
  folderId?: string | null;
}

export interface WorldUserPersona {
  id: string;
  name: string;
  appearance?: string | null;
  personality?: string | null;
  backstory?: string | null;
  content?: string | null;
  customEntries?: PersonaCustomEntry[] | PersonaEntry[] | null;
  npcBehaviorNote?: string | null;
  apiRole?: "system" | "user" | "assistant" | string | null;
  section?: "system-presets" | "examples" | "chat-history" | "post-history" | string | null;
  position?: number | null;
  enabled?: boolean | null;
  alwaysSend?: boolean | null;
  keywords?: string[] | null;
  conditions?: any[] | null;
  conditionLogic?: "all" | "any" | string | null;
  depth?: number | null;
  matchWholeWords?: boolean | null;
  secondaryKeywords?: string[] | null;
  secondaryKeywordLogic?: "AND_ANY" | "AND_ALL" | "NOT_ANY" | "NOT_ALL" | string | null;
  preventRecursion?: boolean | null;
  excludeRecursion?: boolean | null;
  tags?: string[] | null;
  folderId?: string | null;
  openingMessage?: string | null;
  useAsNpcWhenUnchosen?: boolean | null;
}
