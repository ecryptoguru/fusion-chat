import { describe, it, expect } from "vitest";
import { widgetSettingsSchema } from "./schemas";

describe("widgetSettingsSchema", () => {
  const validData = {
    greetMessage: "Hi! How can I help you?",
    defaultSuggestions: {
      suggestion1: "What is your pricing?",
      suggestion2: "How do I reset my password?",
      suggestion3: "Contact support",
    },
    vapiSettings: {
      assistantId: "asst_abc123",
      phoneNumber: "+1234567890",
    },
  };

  it("accepts valid complete data", () => {
    expect(widgetSettingsSchema.safeParse(validData).success).toBe(true);
  });

  it("rejects empty greetMessage", () => {
    const result = widgetSettingsSchema.safeParse({ ...validData, greetMessage: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.path).toContain("greetMessage");
    }
  });

  it("accepts missing optional suggestion fields", () => {
    const data = {
      ...validData,
      defaultSuggestions: {},
    };
    expect(widgetSettingsSchema.safeParse(data).success).toBe(true);
  });

  it("accepts partially filled suggestions", () => {
    const data = {
      ...validData,
      defaultSuggestions: { suggestion1: "Hello?" },
    };
    expect(widgetSettingsSchema.safeParse(data).success).toBe(true);
  });

  it("accepts empty vapiSettings object", () => {
    const data = { ...validData, vapiSettings: {} };
    expect(widgetSettingsSchema.safeParse(data).success).toBe(true);
  });

  it("rejects missing greetMessage", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { greetMessage, ...rest } = validData;
    expect(widgetSettingsSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing defaultSuggestions", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { defaultSuggestions, ...rest } = validData;
    expect(widgetSettingsSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing vapiSettings", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { vapiSettings, ...rest } = validData;
    expect(widgetSettingsSchema.safeParse(rest).success).toBe(false);
  });

  it("accepts optional vapi fields as undefined", () => {
    const data = {
      ...validData,
      vapiSettings: { assistantId: undefined, phoneNumber: undefined },
    };
    expect(widgetSettingsSchema.safeParse(data).success).toBe(true);
  });
});
