import { describe, it, expect } from "vitest";
import { parseSecretString } from "./secrets";
import type { GetSecretValueCommandOutput } from "@aws-sdk/client-secrets-manager";

function makeOutput(secretString: string | undefined): GetSecretValueCommandOutput {
  return {
    SecretString: secretString,
    $metadata: {},
  } as GetSecretValueCommandOutput;
}

describe("parseSecretString", () => {
  it("returns parsed object for valid JSON secret string", () => {
    const output = makeOutput(JSON.stringify({ publicApiKey: "pub", privateApiKey: "priv" }));
    const result = parseSecretString<{ publicApiKey: string; privateApiKey: string }>(output);
    expect(result).toEqual({ publicApiKey: "pub", privateApiKey: "priv" });
  });

  it("returns null when SecretString is undefined", () => {
    const output = makeOutput(undefined);
    expect(parseSecretString(output)).toBeNull();
  });

  it("returns null when SecretString is invalid JSON", () => {
    const output = makeOutput("not-json{{{");
    expect(parseSecretString(output)).toBeNull();
  });

  it("returns null for empty SecretString", () => {
    const output = makeOutput("");
    expect(parseSecretString(output)).toBeNull();
  });

  it("returns null for a JSON null value", () => {
    const output = makeOutput("null");
    // JSON.parse("null") === null, so result is null
    expect(parseSecretString(output)).toBeNull();
  });

  it("returns partial object when some keys are missing", () => {
    const output = makeOutput(JSON.stringify({ publicApiKey: "pub" }));
    const result = parseSecretString<{ publicApiKey: string; privateApiKey: string }>(output);
    expect(result).not.toBeNull();
    expect(result?.publicApiKey).toBe("pub");
    expect(result?.privateApiKey).toBeUndefined();
  });

  it("handles nested objects correctly", () => {
    const data = { a: { b: { c: 42 } } };
    const output = makeOutput(JSON.stringify(data));
    expect(parseSecretString(output)).toEqual(data);
  });
});
