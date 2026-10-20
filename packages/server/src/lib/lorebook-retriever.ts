import type {
  WorldEntry,
  GameState,
  WorldSettings,
  LoreUiBinding,
  Worldbook,
} from "@world-ai/engine";
import { LorebookMatcher, filterEntriesByActiveWorldbooks } from "@world-ai/engine";
import type { LorebookMatchResult } from "@world-ai/engine";

const matcher = new LorebookMatcher();

interface RetrievalOptions {
  entries: WorldEntry[];
  recentMessages: string[];
  state: GameState;
  tokenBudget: number;
  settings?: Partial<Pick<WorldSettings, "lorebookRecursionDepth">>;
  /** Optional model id so the budget uses the right tokenizer
   * (CJK-aware for Gemini/Claude, cl100k_base otherwise). */
  modelId?: string;
  loreUiBindings?: LoreUiBinding[];
  /** Worldbooks (lore modules). Entries in a worldbook that isn't currently
   *  active for `state` are dropped BEFORE keyword/condition matching. */
  worldbooks?: Worldbook[];
}

/**
 * Deterministic lorebook retrieval — delegates entirely to the engine matcher.
 * Synchronous, no external API calls. Worldbook activation is applied first as
 * a pure-from-state pre-filter, then the usual keyword/condition matcher runs
 * on the active subset.
 */
export function retrieveLorebookEntries(
  options: RetrievalOptions
): LorebookMatchResult {
  const entries = options.worldbooks?.length
    ? filterEntriesByActiveWorldbooks(options.entries, options.worldbooks, options.state)
    : options.entries;
  return matcher.matchWithBudget(
    entries,
    options.recentMessages,
    options.state,
    options.tokenBudget,
    options.settings,
    options.modelId,
    options.loreUiBindings,
  );
}
