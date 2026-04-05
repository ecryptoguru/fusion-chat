import { describe, it, expect } from "vitest";
import { createStore } from "jotai";
import {
  screenAtom,
  organizationIdAtom,
  errorMessageAtom,
  loadingMessageAtom,
  conversationIdAtom,
  widgetSettingsAtom,
  vapiSecretsAtom,
  hasVapiSecretsAtom,
  contactSessionIdAtomFamily,
} from "./widget-atoms";

describe("screenAtom", () => {
  it("defaults to 'loading'", () => {
    const store = createStore();
    expect(store.get(screenAtom)).toBe("loading");
  });

  it("can be set to any valid screen", () => {
    const store = createStore();
    store.set(screenAtom, "auth");
    expect(store.get(screenAtom)).toBe("auth");
    store.set(screenAtom, "chat");
    expect(store.get(screenAtom)).toBe("chat");
    store.set(screenAtom, "error");
    expect(store.get(screenAtom)).toBe("error");
  });
});

describe("organizationIdAtom", () => {
  it("defaults to null", () => {
    const store = createStore();
    expect(store.get(organizationIdAtom)).toBeNull();
  });

  it("can be set to a string", () => {
    const store = createStore();
    store.set(organizationIdAtom, "org_abc123");
    expect(store.get(organizationIdAtom)).toBe("org_abc123");
  });
});

describe("errorMessageAtom", () => {
  it("defaults to null", () => {
    const store = createStore();
    expect(store.get(errorMessageAtom)).toBeNull();
  });

  it("stores error message string", () => {
    const store = createStore();
    store.set(errorMessageAtom, "Organization not found");
    expect(store.get(errorMessageAtom)).toBe("Organization not found");
  });
});

describe("loadingMessageAtom", () => {
  it("defaults to null", () => {
    const store = createStore();
    expect(store.get(loadingMessageAtom)).toBeNull();
  });

  it("stores loading message", () => {
    const store = createStore();
    store.set(loadingMessageAtom, "Verifying organization...");
    expect(store.get(loadingMessageAtom)).toBe("Verifying organization...");
  });
});

describe("conversationIdAtom", () => {
  it("defaults to null", () => {
    const store = createStore();
    expect(store.get(conversationIdAtom)).toBeNull();
  });
});

describe("widgetSettingsAtom", () => {
  it("defaults to null", () => {
    const store = createStore();
    expect(store.get(widgetSettingsAtom)).toBeNull();
  });
});

describe("vapiSecretsAtom and hasVapiSecretsAtom", () => {
  it("hasVapiSecretsAtom is false when vapiSecretsAtom is null", () => {
    const store = createStore();
    expect(store.get(vapiSecretsAtom)).toBeNull();
    expect(store.get(hasVapiSecretsAtom)).toBe(false);
  });

  it("hasVapiSecretsAtom is true when vapiSecretsAtom has a value", () => {
    const store = createStore();
    store.set(vapiSecretsAtom, { publicApiKey: "pk_live_abc" });
    expect(store.get(hasVapiSecretsAtom)).toBe(true);
  });

  it("hasVapiSecretsAtom goes back to false when vapiSecretsAtom is cleared", () => {
    const store = createStore();
    store.set(vapiSecretsAtom, { publicApiKey: "pk_live_abc" });
    store.set(vapiSecretsAtom, null);
    expect(store.get(hasVapiSecretsAtom)).toBe(false);
  });
});

describe("contactSessionIdAtomFamily", () => {
  it("creates independent atoms per organizationId", () => {
    const store = createStore();
    const atomA = contactSessionIdAtomFamily("org_a");
    const atomB = contactSessionIdAtomFamily("org_b");
    expect(store.get(atomA)).toBeNull();
    expect(store.get(atomB)).toBeNull();
  });

  it("returns the same atom instance for the same organizationId", () => {
    const atom1 = contactSessionIdAtomFamily("org_same");
    const atom2 = contactSessionIdAtomFamily("org_same");
    expect(atom1).toBe(atom2);
  });

  it("setting one org's atom does not affect another org's atom", () => {
    const store = createStore();
    const atomA = contactSessionIdAtomFamily("org_x");
    const atomB = contactSessionIdAtomFamily("org_y");
    // We can't set typed Id<"contactSessions"> easily in tests so we cast
    store.set(atomA, "session_123" as never);
    expect(store.get(atomA)).toBe("session_123");
    expect(store.get(atomB)).toBeNull();
  });
});
