import { describe, it, expect } from "vitest";
import {
  buildPlayerPersonaPromptBlock,
  convertUnchosenPersonaToNpcEntry,
  initializeWorldSessionWithPersona,
  type WorldDefinitionWithPersonas,
} from "../persona/world-session-persona.js";
import type { WorldUserPersona } from "../persona/index.js";

describe("Multi-Persona World Session", () => {
  const alicePersona: WorldUserPersona = {
    id: "persona-1",
    name: "Alice",
    appearance: "Silver hair and blue eyes",
    personality: "Determined and curious",
    backstory: "Former royal guard adventurer",
    content: "Alice carries an enchanted longsword.",
    openingMessage: "Hello {{user}}, I am ready for our quest as {{pc}}!",
    customEntries: [
      { title: "Special Skill", content: "Master of Frost Magic" },
    ],
  };

  const bobPersona: WorldUserPersona = {
    id: "persona-2",
    name: "Bob",
    appearance: "Tall warrior in heavy armor",
    personality: "Stoic, defensive guardian",
    backstory: "Veteran of the northern frontiers",
    npcBehaviorNote: "Acts as a protective frontline tank for the party",
    keywords: ["bob", "guardian"],
    useAsNpcWhenUnchosen: true,
  };

  const charliePersona: WorldUserPersona = {
    id: "persona-3",
    name: "Charlie",
    content: "A wandering rogue who operates from the shadows.",
    useAsNpcWhenUnchosen: false, // Should NOT be promoted
  };

  const mockWorld: WorldDefinitionWithPersonas = {
    id: "world-123",
    version: "1.0.0",
    name: "Aethelgard",
    description: "A fantasy realm",
    entries: [
      {
        id: "entry-greet",
        name: "Default Greeting",
        content: "Welcome to Aethelgard, {{user}}!",
        role: "greeting",
        enabled: true,
      },
      {
        id: "entry-lore",
        name: "World Lore",
        content: "The ancient citadel towers high.",
        role: "lore",
        enabled: true,
      },
    ],
    variables: [
      { id: "gold", name: "Gold", type: "number", defaultValue: 100 },
      { id: "pc", name: "Active PC", type: "string", defaultValue: "Hero" },
    ],
    userPersonas: [alicePersona, bobPersona, charliePersona],
    useUnchosenPersonasAsNpcs: true,
    bindSelectedPersonaToVariableId: "pc",
  };

  describe("buildPlayerPersonaPromptBlock", () => {
    it("formats all configured persona fields into prompt lines", () => {
      const block = buildPlayerPersonaPromptBlock(alicePersona);
      expect(block).toContain("[The user is roleplaying as Alice]");
      expect(block).toContain("Appearance: Silver hair and blue eyes");
      expect(block).toContain("Personality: Determined and curious");
      expect(block).toContain("Backstory: Former royal guard adventurer");
      expect(block).toContain("Character Sheet & Lore: Alice carries an enchanted longsword.");
      expect(block).toContain("Special Skill: Master of Frost Magic");
    });

    it("handles minimal persona gracefully", () => {
      const minimal: WorldUserPersona = { id: "p-min", name: "Solo" };
      const block = buildPlayerPersonaPromptBlock(minimal);
      expect(block).toBe("[The user is roleplaying as Solo]");
    });
  });

  describe("convertUnchosenPersonaToNpcEntry", () => {
    it("converts unchosen persona with synthesized content and companion note", () => {
      const npcEntry = convertUnchosenPersonaToNpcEntry(bobPersona, alicePersona);
      expect(npcEntry.id).toBe("persona-npc-persona-2");
      expect(npcEntry.name).toBe("NPC (Unchosen Persona) — Bob");
      expect(npcEntry.role).toBe("character");
      expect(npcEntry.content).toContain("NPC — BOB");
      expect(npcEntry.content).toContain("Appearance: Tall warrior in heavy armor");
      expect(npcEntry.content).toContain("Personality: Stoic, defensive guardian");
      expect(npcEntry.content).toContain("Companion / NPC Role (when player is Alice): Acts as a protective frontline tank for the party");
      expect(npcEntry.keywords).toEqual(["bob", "guardian"]);
      expect(npcEntry.tags).toContain("promoted-persona");
      expect(npcEntry.tags).toContain("npc");
    });

    it("uses persona content if explicitly provided", () => {
      const npcEntry = convertUnchosenPersonaToNpcEntry(charliePersona, null);
      expect(npcEntry.content).toContain("A wandering rogue who operates from the shadows.");
      expect(npcEntry.keywords).toEqual(["charlie"]);
    });
  });

  describe("initializeWorldSessionWithPersona", () => {
    it("initializes session with selected persona opening and promoted NPCs", () => {
      const session = initializeWorldSessionWithPersona(mockWorld, "persona-1");

      expect(session.selectedPersona?.name).toBe("Alice");
      expect(session.openingSource).toBe("persona-custom");
      expect(session.openingMessage).toBe("Hello Alice, I am ready for our quest as Alice!");
      expect(session.initialVariables.gold).toBe(100);
      expect(session.initialVariables.pc).toBe("Alice");

      // Bob should be promoted, Charlie excluded (useAsNpcWhenUnchosen = false)
      expect(session.promotedNpcPersonas.map((p) => p.name)).toEqual(["Bob"]);
      expect(session.activeNpcEntries.some((e) => e.id === "persona-npc-persona-2")).toBe(true);

      // Greeting entry should be filtered out from activeNpcEntries
      expect(session.activeNpcEntries.some((e) => e.role === "greeting")).toBe(false);
      // Lore entry should remain
      expect(session.activeNpcEntries.some((e) => e.id === "entry-lore")).toBe(true);

      expect(session.playerCharacterPromptBlock).toContain("[The user is roleplaying as Alice]");
    });

    it("falls back to world default greeting if persona has no custom opening", () => {
      const session = initializeWorldSessionWithPersona(mockWorld, "persona-2");
      expect(session.selectedPersona?.name).toBe("Bob");
      expect(session.openingSource).toBe("world-default");
      expect(session.openingMessage).toBe("Welcome to Aethelgard, Bob!");
      expect(session.initialVariables.pc).toBe("Bob");
    });
  });
});
