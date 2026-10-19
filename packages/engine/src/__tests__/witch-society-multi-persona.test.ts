import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  initializeWorldSessionWithPersona,
  buildPlayerPersonaPromptBlock,
  type WorldDefinitionWithPersonas,
} from "../persona/world-session-persona.js";

describe("The Witch Society: Narrows Chronicles — Multi-Persona Integration", () => {
  const fixturePath = resolve(__dirname, "fixtures/witch-society-narrows-chronicles.json");
  const rawData = readFileSync(fixturePath, "utf-8");
  const sampleWorld: WorldDefinitionWithPersonas = JSON.parse(rawData);

  it("verifies world metadata and multi-persona configuration", () => {
    expect(sampleWorld.id).toBe("9c8b7a5e-3d41-4f26-b0a1-6e2d8c4a1f37");
    expect(sampleWorld.name).toBe("The Witch Society: Narrows Chronicles");
    expect(sampleWorld.useUnchosenPersonasAsNpcs).toBe(true);
    expect(sampleWorld.bindSelectedPersonaToVariableId).toBe("pc");
    expect(sampleWorld.userPersonas).toHaveLength(2);
  });

  describe("Session Initialization — Choosing Caspian Kessler", () => {
    const session = initializeWorldSessionWithPersona(sampleWorld, "persona-caspian-kessler");

    it("selects Caspian Kessler and binds pc variable", () => {
      expect(session.selectedPersona?.id).toBe("persona-caspian-kessler");
      expect(session.selectedPersona?.name).toBe("Caspian Kessler");
      expect(session.initialVariables.pc).toBe("Caspian Kessler");
      expect(session.initialVariables["society-trust"]).toBe(30);
      expect(session.initialVariables["story-phase"]).toBe("coven-days");
    });

    it("uses Caspian's custom individual opening message", () => {
      expect(session.openingSource).toBe("persona-custom");
      expect(session.openingMessage).toContain("Candlelight wavers across the standing stones");
      expect(session.openingMessage).toContain("Caspian Kessler. Outsider with the ley-line eyes");
    });

    it("promotes unchosen Aisling Quinlan into an active NPC entry", () => {
      expect(session.promotedNpcPersonas).toHaveLength(1);
      expect(session.promotedNpcPersonas[0]?.name).toBe("Aisling Quinlan");

      const aislingNpc = session.activeNpcEntries.find(
        (e) => e.id === "persona-npc-persona-aisling-quinlan"
      );
      expect(aislingNpc).toBeDefined();
      expect(aislingNpc?.role).toBe("character");
      expect(aislingNpc?.keywords).toEqual(["aisling", "quinlan", "cousin"]);
      expect(aislingNpc?.tags).toContain("promoted-persona");
      expect(aislingNpc?.tags).toContain("npc");
      expect(aislingNpc?.content).toContain("Companion / NPC Role (when player is Caspian Kessler)");
    });

    it("excludes the world default greeting from activeNpcEntries", () => {
      const greetingEntry = session.activeNpcEntries.find((e) => e.role === "greeting");
      expect(greetingEntry).toBeUndefined();
    });

    it("builds the player character prompt block for Caspian", () => {
      expect(session.playerCharacterPromptBlock).toContain("[The user is roleplaying as Caspian Kessler]");
      expect(session.playerCharacterPromptBlock).toContain("Appearance: 22, athletic and lean, 6'0\"");
      expect(session.playerCharacterPromptBlock).toContain("Personality: Determined, curious, slightly reserved");
      expect(session.playerCharacterPromptBlock).toContain("Affinity & Scar: Ley-line sensitivity");
    });
  });

  describe("Session Initialization — Choosing Aisling Quinlan", () => {
    const session = initializeWorldSessionWithPersona(sampleWorld, "persona-aisling-quinlan");

    it("selects Aisling Quinlan and binds pc variable", () => {
      expect(session.selectedPersona?.id).toBe("persona-aisling-quinlan");
      expect(session.selectedPersona?.name).toBe("Aisling Quinlan");
      expect(session.initialVariables.pc).toBe("Aisling Quinlan");
    });

    it("uses Aisling's custom individual opening message", () => {
      expect(session.openingSource).toBe("persona-custom");
      expect(session.openingMessage).toContain("Aisling Quinlan, pride of the coven bloodline");
    });

    it("promotes unchosen Caspian Kessler into an active NPC entry", () => {
      expect(session.promotedNpcPersonas).toHaveLength(1);
      expect(session.promotedNpcPersonas[0]?.name).toBe("Caspian Kessler");

      const caspianNpc = session.activeNpcEntries.find(
        (e) => e.id === "persona-npc-persona-caspian-kessler"
      );
      expect(caspianNpc).toBeDefined();
      expect(caspianNpc?.role).toBe("character");
      expect(caspianNpc?.keywords).toEqual(["caspian", "kessler", "outsider"]);
      expect(caspianNpc?.content).toContain("Companion / NPC Role (when player is Aisling Quinlan)");
    });

    it("builds the player character prompt block for Aisling", () => {
      const block = buildPlayerPersonaPromptBlock(session.selectedPersona!);
      expect(block).toContain("[The user is roleplaying as Aisling Quinlan]");
      expect(block).toContain("Appearance: 22, graceful, 5'7\", moss-green doe eyes");
      expect(block).toContain("Quinlan Lineage: Coven-born status");
    });
  });

  describe("Disabled unchosen NPC promotion flag", () => {
    it("does not promote unchosen personas when flag is false", () => {
      const modifiedWorld: WorldDefinitionWithPersonas = {
        ...sampleWorld,
        useUnchosenPersonasAsNpcs: false,
      };

      const session = initializeWorldSessionWithPersona(modifiedWorld, "persona-caspian-kessler");
      expect(session.promotedNpcPersonas).toHaveLength(0);
      expect(session.activeNpcEntries.some((e) => e.id.startsWith("persona-npc-"))).toBe(false);
    });
  });
});
