// ─── tests/usePlan.test.js ────────────────────────────────────────────────────
// Sprint 3 — #6 Test unitari usePlan.js
// Runner: Vitest  →  npx vitest run tests/usePlan.test.js
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeEach } from "vitest";
import { usePlan, PLAN_LIMITS } from "../src/hooks/usePlan";

// ── Helper: chiama usePlan come funzione pura (senza React) ───────────────────
// usePlan è una funzione hook ma non usa useState/useEffect → testabile direttamente.
function plan(workspaceOverride = {}, proyectos = []) {
  return usePlan({ workspace: { plan: "free", ...workspaceOverride } }, proyectos);
}

// Progetti di test
const makeProyecto = (estado = "Borrador", fecha = "2025-01-01") => ({
  estado, info: { fecha }, partidas: [], updatedAt: fecha,
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PLAN_LIMITS — struttura dati", () => {
  it("free ha tutti i limiti definiti", () => {
    const f = PLAN_LIMITS.free;
    expect(f.maxProyectos).toBe(5);
    expect(f.maxPartidas).toBe(15);
    expect(f.maxListino).toBe(20);
    expect(f.maxBodega).toBe(10);
    expect(f.maxKits).toBe(3);
    expect(f.maxCalcoli).toBe(5);
    expect(f.historialDays).toBe(30);
    expect(f.pdfWatermark).toBe(true);
    expect(f.appWatermark).toBe(true);
  });

  it("pro ha tutti i limiti a Infinity", () => {
    const p = PLAN_LIMITS.pro;
    expect(p.maxProyectos).toBe(Infinity);
    expect(p.maxPartidas).toBe(Infinity);
    expect(p.maxListino).toBe(Infinity);
    expect(p.maxBodega).toBe(Infinity);
    expect(p.pdfWatermark).toBe(false);
    expect(p.appWatermark).toBe(false);
  });

  it("team è identico a pro nelle feature", () => {
    expect(PLAN_LIMITS.team.exportExcel).toBe(true);
    expect(PLAN_LIMITS.team.firma).toBe(true);
    expect(PLAN_LIMITS.team.maxProyectos).toBe(Infinity);
  });

  it("free ha whatsapp true (funnel marketing)", () => {
    expect(PLAN_LIMITS.free.whatsapp).toBe(true);
  });

  it("free blocca exportExcel, firma, fatture, templates, agenda", () => {
    const f = PLAN_LIMITS.free;
    expect(f.exportExcel).toBe(false);
    expect(f.firma).toBe(false);
    expect(f.fatture).toBe(false);
    expect(f.templates).toBe(false);
    expect(f.agenda).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("usePlan — piano Free", () => {
  it("isPro è false", () => {
    expect(plan().isPro).toBe(false);
  });

  it("rawPlan e plan sono 'free'", () => {
    const p = plan();
    expect(p.rawPlan).toBe("free");
    expect(p.plan).toBe("free");
  });

  it("canUse blocca exportExcel", () => {
    expect(plan().canUse("exportExcel")).toBe(false);
  });

  it("canUse blocca firma", () => {
    expect(plan().canUse("firma")).toBe(false);
  });

  it("canUse blocca fatture", () => {
    expect(plan().canUse("fatture")).toBe(false);
  });

  it("canUse blocca templates", () => {
    expect(plan().canUse("templates")).toBe(false);
  });

  it("canUse blocca agenda", () => {
    expect(plan().canUse("agenda")).toBe(false);
  });

  it("canUse permette whatsapp", () => {
    expect(plan().canUse("whatsapp")).toBe(true);
  });

  it("canPlan è alias di canUse", () => {
    const p = plan();
    expect(p.canPlan("exportExcel")).toBe(false);
    expect(p.canPlan("whatsapp")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("usePlan — limiti numerici Free", () => {

  describe("canAdd('proyectos')", () => {
    it("permette aggiungere con 0 progetti", () => {
      expect(plan({}, []).canAdd("proyectos", 0)).toBe(true);
    });

    it("permette aggiungere con 4 progetti (sotto limite)", () => {
      expect(plan({}, []).canAdd("proyectos", 4)).toBe(true);
    });

    it("blocca con esattamente 5 progetti (al limite)", () => {
      expect(plan({}, []).canAdd("proyectos", 5)).toBe(false);
    });

    it("blocca con 6 progetti (sopra limite)", () => {
      expect(plan({}, []).canAdd("proyectos", 6)).toBe(false);
    });
  });

  describe("canAdd('partidas')", () => {
    it("permette con 14 partidas", () => {
      expect(plan().canAdd("partidas", 14)).toBe(true);
    });

    it("blocca con 15 partidas (al limite)", () => {
      expect(plan().canAdd("partidas", 15)).toBe(false);
    });
  });

  describe("canAdd('listino')", () => {
    it("permette con 19 voci", () => {
      expect(plan().canAdd("listino", 19)).toBe(true);
    });

    it("blocca con 20 voci (al limite)", () => {
      expect(plan().canAdd("listino", 20)).toBe(false);
    });
  });

  describe("canAdd('bodega')", () => {
    it("permette con 9 articoli", () => {
      expect(plan().canAdd("bodega", 9)).toBe(true);
    });

    it("blocca con 10 articoli (al limite)", () => {
      expect(plan().canAdd("bodega", 10)).toBe(false);
    });
  });

  describe("canAdd('kits')", () => {
    it("permette con 2 kits", () => {
      expect(plan().canAdd("kits", 2)).toBe(true);
    });

    it("blocca con 3 kits (al limite)", () => {
      expect(plan().canAdd("kits", 3)).toBe(false);
    });
  });

  describe("canAdd('calcoli')", () => {
    it("permette con 4 calcoli", () => {
      expect(plan().canAdd("calcoli", 4)).toBe(true);
    });

    it("blocca con 5 calcoli (al limite)", () => {
      expect(plan().canAdd("calcoli", 5)).toBe(false);
    });
  });

  describe("remaining()", () => {
    it("restituisce 5 con 0 progetti", () => {
      expect(plan().remaining("proyectos", 0)).toBe(5);
    });

    it("restituisce 1 con 4 progetti", () => {
      expect(plan().remaining("proyectos", 4)).toBe(1);
    });

    it("restituisce 0 con 5 progetti (al limite)", () => {
      expect(plan().remaining("proyectos", 5)).toBe(0);
    });

    it("non scende sotto 0 con 6 progetti", () => {
      expect(plan().remaining("proyectos", 6)).toBe(0);
    });

    it("restituisce 5 partidas rimanenti con 10 usate", () => {
      expect(plan().remaining("partidas", 10)).toBe(5);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("usePlan — piano Pro", () => {
  const pro = () => plan({ plan: "pro" });

  it("isPro è true", () => {
    expect(pro().isPro).toBe(true);
  });

  it("canUse permette tutte le feature", () => {
    const p = pro();
    expect(p.canUse("exportExcel")).toBe(true);
    expect(p.canUse("firma")).toBe(true);
    expect(p.canUse("fatture")).toBe(true);
    expect(p.canUse("templates")).toBe(true);
    expect(p.canUse("agenda")).toBe(true);
  });

  it("canAdd non blocca mai (Infinity)", () => {
    const p = pro();
    expect(p.canAdd("proyectos", 9999)).toBe(true);
    expect(p.canAdd("partidas", 9999)).toBe(true);
    expect(p.canAdd("listino", 9999)).toBe(true);
  });

  it("remaining restituisce Infinity", () => {
    const p = pro();
    expect(p.remaining("proyectos", 100)).toBe(Infinity);
    expect(p.remaining("partidas", 100)).toBe(Infinity);
  });

  it("canCreateProyecto è sempre true", () => {
    const proyectos = Array(100).fill(makeProyecto());
    expect(plan({ plan: "pro" }, proyectos).canCreateProyecto()).toBe(true);
  });

  it("limits.pdfWatermark è false", () => {
    expect(pro().limits.pdfWatermark).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("usePlan — piano Team", () => {
  it("isPro è true anche per team", () => {
    expect(plan({ plan: "team" }).isPro).toBe(true);
  });

  it("canUse tutte le feature", () => {
    const p = plan({ plan: "team" });
    expect(p.canUse("firma")).toBe(true);
    expect(p.canUse("exportExcel")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("usePlan — Trial Pro", () => {
  const futuro = new Date(Date.now() + 7 * 86400000).toISOString();
  const passato = new Date(Date.now() - 1 * 86400000).toISOString();

  it("trial attivo → isPro true", () => {
    expect(plan({ plan: "free", trialEndsAt: futuro }).isPro).toBe(true);
  });

  it("trial attivo → plan è 'pro'", () => {
    expect(plan({ plan: "free", trialEndsAt: futuro }).plan).toBe("pro");
  });

  it("trial attivo → rawPlan rimane 'free'", () => {
    expect(plan({ plan: "free", trialEndsAt: futuro }).rawPlan).toBe("free");
  });

  it("trial attivo → isTrialActive true", () => {
    expect(plan({ plan: "free", trialEndsAt: futuro }).isTrialActive).toBe(true);
  });

  it("trial attivo → trialDaysLeft > 0", () => {
    expect(plan({ plan: "free", trialEndsAt: futuro }).trialDaysLeft).toBeGreaterThan(0);
  });

  it("trial scaduto → isPro false", () => {
    expect(plan({ plan: "free", trialEndsAt: passato }).isPro).toBe(false);
  });

  it("trial scaduto → isTrialActive false", () => {
    expect(plan({ plan: "free", trialEndsAt: passato }).isTrialActive).toBe(false);
  });

  it("trial scaduto → trialDaysLeft è 0", () => {
    expect(plan({ plan: "free", trialEndsAt: passato }).trialDaysLeft).toBe(0);
  });

  it("trial attivo → canUse firma", () => {
    expect(plan({ plan: "free", trialEndsAt: futuro }).canUse("firma")).toBe(true);
  });

  it("trial attivo → canAdd senza limiti", () => {
    expect(plan({ plan: "free", trialEndsAt: futuro }).canAdd("proyectos", 100)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("usePlan — canCreateProyecto e proyectosRestantes", () => {
  it("Free: canCreateProyecto false con 5 progetti", () => {
    const proyectos = Array(5).fill(makeProyecto());
    expect(plan({}, proyectos).canCreateProyecto()).toBe(false);
  });

  it("Free: canCreateProyecto true con 4 progetti", () => {
    const proyectos = Array(4).fill(makeProyecto());
    expect(plan({}, proyectos).canCreateProyecto()).toBe(true);
  });

  it("Free: conta TUTTI i progetti (anche Finalizado)", () => {
    // Il counter Free è PERMANENTE — include Finalizado e Rechazado
    const proyectos = [
      makeProyecto("Finalizado"),
      makeProyecto("Rechazado"),
      makeProyecto("Borrador"),
      makeProyecto("Enviado"),
      makeProyecto("Aceptado"),
    ];
    expect(plan({}, proyectos).canCreateProyecto()).toBe(false);
    expect(plan({}, proyectos).totalCount).toBe(5);
  });

  it("Free: proyectosRestantes corretto", () => {
    const proyectos = Array(3).fill(makeProyecto());
    expect(plan({}, proyectos).proyectosRestantes).toBe(2);
  });

  it("Pro: proyectosRestantes è Infinity", () => {
    const proyectos = Array(100).fill(makeProyecto());
    expect(plan({ plan: "pro" }, proyectos).proyectosRestantes).toBe(Infinity);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("usePlan — filterByHistorial", () => {
  const oggi = new Date();
  const ieri = new Date(oggi - 1 * 86400000).toISOString().slice(0, 10);
  const fa20gg = new Date(oggi - 20 * 86400000).toISOString().slice(0, 10);
  const fa35gg = new Date(oggi - 35 * 86400000).toISOString().slice(0, 10);

  const items = [
    { id: 1, fecha: ieri },
    { id: 2, fecha: fa20gg },
    { id: 3, fecha: fa35gg },   // fuori dai 30 giorni Free
  ];

  it("Free: esclude elementi oltre 30 giorni", () => {
    const result = plan().filterByHistorial(items, x => x.fecha);
    expect(result.map(x => x.id)).toEqual([1, 2]);
    expect(result.find(x => x.id === 3)).toBeUndefined();
  });

  it("Free: include elementi entro 30 giorni", () => {
    const result = plan().filterByHistorial(items, x => x.fecha);
    expect(result.length).toBe(2);
  });

  it("Pro: restituisce tutti gli elementi", () => {
    const result = plan({ plan: "pro" }).filterByHistorial(items, x => x.fecha);
    expect(result.length).toBe(3);
  });

  it("Free: lista vuota → restituisce lista vuota", () => {
    expect(plan().filterByHistorial([], x => x.fecha)).toEqual([]);
  });

  it("Pro: lista vuota → restituisce lista vuota", () => {
    expect(plan({ plan: "pro" }).filterByHistorial([], x => x.fecha)).toEqual([]);
  });

  it("Free: data non valida → esclude l'elemento", () => {
    const invalid = [{ id: 99, fecha: "non-una-data" }];
    const result = plan().filterByHistorial(invalid, x => x.fecha);
    expect(result.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("usePlan — piano non riconosciuto → fallback free", () => {
  it("piano 'unknown' → usa limiti free", () => {
    const p = plan({ plan: "unknown" });
    expect(p.isPro).toBe(false);
    expect(p.limits.maxProyectos).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("usePlan — watermark", () => {
  it("Free: pdfWatermark true", () => {
    expect(plan().limits.pdfWatermark).toBe(true);
  });

  it("Free: appWatermark true", () => {
    expect(plan().limits.appWatermark).toBe(true);
  });

  it("Pro: pdfWatermark false", () => {
    expect(plan({ plan: "pro" }).limits.pdfWatermark).toBe(false);
  });

  it("Pro: appWatermark false", () => {
    expect(plan({ plan: "pro" }).limits.appWatermark).toBe(false);
  });

  it("Trial attivo: pdfWatermark false (eredita pro)", () => {
    const futuro = new Date(Date.now() + 7 * 86400000).toISOString();
    expect(plan({ plan: "free", trialEndsAt: futuro }).limits.pdfWatermark).toBe(false);
  });
});
