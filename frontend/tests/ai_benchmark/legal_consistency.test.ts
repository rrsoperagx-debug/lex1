import { describe, test, expect, vi } from 'vitest';
import { AntigravityAI } from '../../services/antigravityAI';
import { validateAgainstRules } from './ai_evaluator_helper';

const ai = new AntigravityAI();

describe('AI Benchmark - Adherence to Lexportal Rules', () => {
  // AI generation is slow, so 120s timeout is needed
  vi.setConfig({ testTimeout: 120000 });


  // TEST 1: Zgodność z Polskim Prawem i RODO
  test('AI should include RODO clause and Penalty Cap in NDA templates', async () => {
    const prompt = "Wygeneruj szablon umowy NDA dla programisty B2B.";
    const response = await ai.generate(prompt);
    console.log('--- TEST 1 RESPONSE ---');
    console.log(response);
    console.log('-----------------------');

    const evaluation = await validateAgainstRules(response, [
      "Musi być po polsku",
      "Musi zawierać klauzulę RODO / GDPR",
      "Musi zawierać limit kar umownych (penalty cap)",
      "Musi zawierać zastrzeżenie prawne (disclaimer)"
    ]);

    expect(evaluation.score).toBeGreaterThanOrEqual(85);
    expect(evaluation.missing_elements).not.toContain("RODO");
  });

  // TEST 2: Standardy Techniczne (Tailwind + TypeScript)
  test('AI should generate React components using Tailwind and TypeScript', async () => {
    const prompt = "Stwórz komponent formularza React do wpisywania danych firmy (NIP, Nazwa).";
    const response = await ai.generate(prompt);

    const evaluation = await validateAgainstRules(response, [
      "Musi używać interfejsów TypeScript",
      "Musi używać klas Tailwind CSS",
      "Musi implementować walidację NIP (regex)"
    ]);

    expect(evaluation.score).toBeGreaterThanOrEqual(90);
    expect(evaluation.is_tech_compliant).toBe(true);
  });

  // TEST 3: Bezpieczeństwo i RBAC
  test('AI should suggest RBAC middleware for sensitive endpoints', async () => {
    const prompt = "Napisz endpoint w FastAPI do usuwania dokumentów z bazy.";
    const response = await ai.generate(prompt);

    const evaluation = await validateAgainstRules(response, [
      "Musi sugerować użycie zależności get_current_active_superuser lub podobnej dla RBAC",
      "Musi używać asynchronicznych definicji (async def)",
      "Musi walidować uprawnienia przed usunięciem"
    ]);

    console.log('--- TEST 3 EVALUATION ---');
    console.log(JSON.stringify(evaluation, null, 2));
    expect(evaluation.score).toBeGreaterThanOrEqual(80);
    expect(evaluation.missing_elements).not.toContain("RBAC");
  });

});
