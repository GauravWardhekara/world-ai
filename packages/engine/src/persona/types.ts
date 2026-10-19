/**
 * Yumina OSS — Multi-Persona & NPC Parity Schema Extension
 * Engine Persona and NPC types for session initialization and prompt generation.
 */

export type SecondaryKeywordLogic = 'AND_ANY' | 'AND_ALL' | 'NOT_ANY' | 'NOT_ALL';
export type ConditionLogic = 'all' | 'any';
export type EntrySection = 'system-presets' | 'chat-history' | 'post-history' | 'examples';
export type ApiRole = 'system' | 'user' | 'assistant';

export interface EntryCondition {
  variableId: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
  value: string | number | boolean;
}

export interface PersonaCustomEntry {
  id?: string;
  title: string;
  content: string;
}

/**
 * Full NPC field set from Yumina's WorldEntry schema.
 * UserPersonas inherit 100% of these fields so they can be authored with the
 * same depth as NPCs and seamlessly injected as NPC entries when unchosen.
 */
export interface NpcEntryFields {
  id: string;
  name: string;
  content: string;
  role?: 'character' | 'lore' | 'plot' | 'system' | 'style' | 'greeting' | 'example';
  apiRole?: ApiRole;
  section?: EntrySection;
  position?: number;
  enabled?: boolean;
  alwaysSend?: boolean;
  keywords?: string[];
  conditions?: EntryCondition[];
  conditionLogic?: ConditionLogic;
  depth?: number | null;
  matchWholeWords?: boolean;
  secondaryKeywords?: string[];
  secondaryKeywordLogic?: SecondaryKeywordLogic;
  preventRecursion?: boolean;
  excludeRecursion?: boolean;
  tags?: string[];
  folderId?: string | null;
}

/**
 * WorldUserPersona combines:
 * 1. Standard Yumina User Persona fields (name, avatar, appearance, personality, backstory, custom entries)
 * 2. All NPC configuration fields (NpcEntryFields)
 * 3. Optional individual opening/introduction message (openingMessage)
 * 4. Optional per-persona override for converting unchosen personas into NPCs
 */
export interface WorldUserPersona extends Omit<NpcEntryFields, 'content'> {
  content?: string;
  avatar?: string;
  appearance?: string;
  personality?: string;
  backstory?: string;
  customEntries?: PersonaCustomEntry[];

  /**
   * Optional individual opening/introduction message shown when the
   * player selects this persona at the start of a session. If empty/null, the
   * engine falls back to the world's default greeting entry.
   */
  openingMessage?: string | null;

  /**
   * Optional per-persona flag controlling whether this persona
   * becomes an NPC when another persona is chosen (used when the world-level
   * `useUnchosenPersonasAsNpcs` flag is enabled).
   */
  useAsNpcWhenUnchosen?: boolean;

  /**
   * Optional instructions describing how this persona behaves as an NPC
   * companion/rival when not selected by the player.
   */
  npcBehaviorNote?: string;
}

export interface WorldMultiPersonaConfig {
  userPersonas: WorldUserPersona[];
  useUnchosenPersonasAsNpcs: boolean;
  bindSelectedPersonaToVariableId?: string | null;
}
