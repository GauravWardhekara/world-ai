import {
  NpcEntryFields,
  WorldUserPersona,
} from './types.js';

export interface WorldDefinitionWithPersonas {
  id: string;
  version: string;
  name: string;
  description: string;
  entries: NpcEntryFields[];
  variables: Array<{
    id: string;
    name: string;
    type: string;
    defaultValue: any;
    description?: string;
    category?: string;
    behaviorRules?: string;
  }>;
  userPersonas?: WorldUserPersona[];
  useUnchosenPersonasAsNpcs?: boolean;
  bindSelectedPersonaToVariableId?: string | null;
}

export interface SessionInitResult {
  selectedPersona: WorldUserPersona | null;
  openingMessage: string;
  openingSource: 'persona-custom' | 'world-default';
  activeNpcEntries: NpcEntryFields[];
  promotedNpcPersonas: WorldUserPersona[];
  initialVariables: Record<string, any>;
  playerCharacterPromptBlock: string;
}

/**
 * Formats the chosen WorldUserPersona into Yumina's active player character
 * prompt block (Order 2 in Yumina's prompt assembly pipeline).
 */
export function buildPlayerPersonaPromptBlock(persona: WorldUserPersona): string {
  const lines: string[] = [
    `[The user is roleplaying as ${persona.name}]`,
  ];
  if (persona.appearance?.trim()) {
    lines.push(`Appearance: ${persona.appearance.trim()}`);
  }
  if (persona.personality?.trim()) {
    lines.push(`Personality: ${persona.personality.trim()}`);
  }
  if (persona.backstory?.trim()) {
    lines.push(`Backstory: ${persona.backstory.trim()}`);
  }
  if (persona.content?.trim()) {
    lines.push(`Character Sheet & Lore: ${persona.content.trim()}`);
  }
  if (persona.customEntries?.length) {
    for (const entry of persona.customEntries) {
      if (entry.title?.trim() && entry.content?.trim()) {
        lines.push(`${entry.title.trim()}: ${entry.content.trim()}`);
      }
    }
  }
  return lines.join('\n');
}

/**
 * Converts an unchosen WorldUserPersona into a standard Yumina NPC WorldEntry
 * preserving 100% of its configured NPC fields (keywords, section, depth,
 * conditions, recursion flags, etc.).
 */
export function convertUnchosenPersonaToNpcEntry(
  persona: WorldUserPersona,
  chosenPersona: WorldUserPersona | null
): NpcEntryFields {
  const synthesizedContentParts: string[] = [];

  if (persona.content?.trim()) {
    synthesizedContentParts.push(persona.content.trim());
  } else {
    synthesizedContentParts.push(`NPC — ${persona.name.toUpperCase()}`);
    if (persona.appearance?.trim()) {
      synthesizedContentParts.push(`Appearance: ${persona.appearance.trim()}`);
    }
    if (persona.personality?.trim()) {
      synthesizedContentParts.push(`Personality: ${persona.personality.trim()}`);
    }
    if (persona.backstory?.trim()) {
      synthesizedContentParts.push(`Backstory: ${persona.backstory.trim()}`);
    }
  }

  if (persona.npcBehaviorNote?.trim()) {
    synthesizedContentParts.push(
      `Companion / NPC Role (when player is ${chosenPersona?.name ?? 'another persona'}): ${persona.npcBehaviorNote.trim()}`
    );
  }

  if (persona.customEntries?.length) {
    for (const item of persona.customEntries) {
      if (item.title?.trim() && item.content?.trim()) {
        synthesizedContentParts.push(`${item.title.trim()}: ${item.content.trim()}`);
      }
    }
  }

  return {
    id: `persona-npc-${persona.id}`,
    name: `NPC (Unchosen Persona) — ${persona.name}`,
    content: synthesizedContentParts.join('\n'),
    role: 'character',
    apiRole: persona.apiRole || 'system',
    section: persona.section || 'chat-history',
    position: persona.position ?? 0,
    enabled: persona.enabled ?? true,
    alwaysSend: persona.alwaysSend ?? false,
    keywords: persona.keywords?.length
      ? persona.keywords
      : persona.name
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean),
    conditions: persona.conditions || [],
    conditionLogic: persona.conditionLogic || 'all',
    depth: persona.depth ?? 4,
    matchWholeWords: persona.matchWholeWords ?? false,
    secondaryKeywords: persona.secondaryKeywords || [],
    secondaryKeywordLogic: persona.secondaryKeywordLogic || 'AND_ANY',
    preventRecursion: persona.preventRecursion ?? false,
    excludeRecursion: persona.excludeRecursion ?? false,
    tags: Array.from(new Set([...(persona.tags || []), 'npc', 'promoted-persona'])),
    folderId: persona.folderId ?? null,
  };
}

/**
 * Initializes a play session for the world with a chosen persona:
 * 1. Resolves the persona's individual opening message (or falls back to the
 *    world's default greeting entry).
 * 2. Promotes unchosen user personas into NPC entries when
 *    `world.useUnchosenPersonasAsNpcs` is true.
 * 3. Binds the chosen persona to the configured variable (e.g. `pc`) and
 *    replaces `{{user}}` / `{{pc}}` macros in the opening message.
 */
export function initializeWorldSessionWithPersona(
  world: WorldDefinitionWithPersonas,
  selectedPersonaId: string
): SessionInitResult {
  const personas = world.userPersonas || [];
  const selectedPersona =
    personas.find((p) => p.id === selectedPersonaId) || personas[0] || null;

  // 1. Initialize variables and bind PC variable if configured
  const initialVariables: Record<string, any> = {};
  for (const v of world.variables || []) {
    initialVariables[v.id] = v.defaultValue;
  }
  if (selectedPersona && world.bindSelectedPersonaToVariableId) {
    initialVariables[world.bindSelectedPersonaToVariableId] = selectedPersona.name;
  }

  // 2. Resolve opening message (Persona-specific opening -> fallback to World greeting)
  const defaultGreetingEntry = world.entries.find(
    (e) => e.role === 'greeting' && e.enabled !== false
  );
  const rawPersonaOpening = selectedPersona?.openingMessage?.trim();
  const openingSource: 'persona-custom' | 'world-default' = rawPersonaOpening
    ? 'persona-custom'
    : 'world-default';

  const rawOpening =
    rawPersonaOpening ||
    defaultGreetingEntry?.content ||
    `Welcome to ${world.name}.`;

  const openingMessage = rawOpening
    .replace(/\{\{user\}\}/gi, selectedPersona?.name || 'Player')
    .replace(/\{\{pc\}\}/gi, selectedPersona?.name || 'Player');

  // 3. Promote unchosen personas to NPCs if flag is enabled
  const shouldPromoteUnchosen = Boolean(world.useUnchosenPersonasAsNpcs);
  const promotedNpcPersonas = shouldPromoteUnchosen
    ? personas.filter(
        (p) =>
          p.id !== selectedPersona?.id &&
          p.enabled !== false &&
          p.useAsNpcWhenUnchosen !== false
      )
    : [];

  const promotedNpcEntries = promotedNpcPersonas.map((p) =>
    convertUnchosenPersonaToNpcEntry(p, selectedPersona)
  );

  // Combine existing world entries (excluding default greeting) with promoted NPC entries
  const activeNpcEntries = [
    ...world.entries.filter((e) => e.role !== 'greeting'),
    ...promotedNpcEntries,
  ];

  const playerCharacterPromptBlock = selectedPersona
    ? buildPlayerPersonaPromptBlock(selectedPersona)
    : '[The user is roleplaying as Player]';

  return {
    selectedPersona,
    openingMessage,
    openingSource,
    activeNpcEntries,
    promotedNpcPersonas,
    initialVariables,
    playerCharacterPromptBlock,
  };
}
