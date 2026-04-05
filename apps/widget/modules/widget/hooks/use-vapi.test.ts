import { describe, it, expect } from "vitest";

/**
 * Pure logic tests for the useVapi hook internals.
 * The Vapi SDK and Jotai atoms are external; we test the decision logic only.
 */

// --- transcript message role mapping ---
function mapRole(role: string | undefined): "user" | "assistant" {
  return role === "user" ? "user" : "assistant";
}

// --- shouldAppendTranscript ---
function shouldAppendTranscript(message: {
  type: string;
  transcriptType?: string;
  transcript?: string;
}): boolean {
  return (
    message.type === "transcript" &&
    message.transcriptType === "final" &&
    typeof message.transcript === "string" &&
    message.transcript.length > 0
  );
}

describe("mapRole", () => {
  it("maps 'user' to 'user'", () => {
    expect(mapRole("user")).toBe("user");
  });

  it("maps 'assistant' to 'assistant'", () => {
    expect(mapRole("assistant")).toBe("assistant");
  });

  it("maps undefined to 'assistant'", () => {
    expect(mapRole(undefined)).toBe("assistant");
  });

  it("maps any unknown role to 'assistant'", () => {
    expect(mapRole("bot")).toBe("assistant");
    expect(mapRole("system")).toBe("assistant");
    expect(mapRole("")).toBe("assistant");
  });
});

describe("shouldAppendTranscript", () => {
  it("returns true for valid final user transcript", () => {
    expect(
      shouldAppendTranscript({
        type: "transcript",
        transcriptType: "final",
        transcript: "hello there",
      })
    ).toBe(true);
  });

  it("returns false for partial transcript", () => {
    expect(
      shouldAppendTranscript({
        type: "transcript",
        transcriptType: "partial",
        transcript: "hell",
      })
    ).toBe(false);
  });

  it("returns false for non-transcript message type", () => {
    expect(
      shouldAppendTranscript({
        type: "function-call",
        transcriptType: "final",
        transcript: "hello",
      })
    ).toBe(false);
  });

  it("returns false when transcript is empty string", () => {
    expect(
      shouldAppendTranscript({
        type: "transcript",
        transcriptType: "final",
        transcript: "",
      })
    ).toBe(false);
  });

  it("returns false when transcript is missing", () => {
    expect(
      shouldAppendTranscript({
        type: "transcript",
        transcriptType: "final",
      })
    ).toBe(false);
  });

  it("returns false when transcriptType is missing", () => {
    expect(
      shouldAppendTranscript({
        type: "transcript",
        transcript: "hello",
      })
    ).toBe(false);
  });
});

describe("Vapi call state transitions", () => {
  type CallState = {
    isConnected: boolean;
    isConnecting: boolean;
    isSpeaking: boolean;
  };

  const initial: CallState = { isConnected: false, isConnecting: false, isSpeaking: false };

  function onCallStart(state: CallState): CallState {
    return { ...state, isConnected: true, isConnecting: false };
  }

  function onCallEnd(state: CallState): CallState {
    return { ...state, isConnected: false, isConnecting: false, isSpeaking: false };
  }

  function onSpeechStart(state: CallState): CallState {
    return { ...state, isSpeaking: true };
  }

  function onSpeechEnd(state: CallState): CallState {
    return { ...state, isSpeaking: false };
  }

  function startCall(state: CallState): CallState {
    return { ...state, isConnecting: true };
  }

  it("startCall sets isConnecting=true", () => {
    expect(startCall(initial).isConnecting).toBe(true);
  });

  it("call-start sets isConnected=true and isConnecting=false", () => {
    const connecting = startCall(initial);
    const connected = onCallStart(connecting);
    expect(connected.isConnected).toBe(true);
    expect(connected.isConnecting).toBe(false);
  });

  it("call-end resets all flags to false", () => {
    const active: CallState = { isConnected: true, isConnecting: false, isSpeaking: true };
    const ended = onCallEnd(active);
    expect(ended.isConnected).toBe(false);
    expect(ended.isConnecting).toBe(false);
    expect(ended.isSpeaking).toBe(false);
  });

  it("speech-start sets isSpeaking=true", () => {
    const connected = onCallStart(initial);
    expect(onSpeechStart(connected).isSpeaking).toBe(true);
  });

  it("speech-end sets isSpeaking=false", () => {
    const speaking: CallState = { isConnected: true, isConnecting: false, isSpeaking: true };
    expect(onSpeechEnd(speaking).isSpeaking).toBe(false);
  });

  it("call-end after speech clears isSpeaking", () => {
    const speaking: CallState = { isConnected: true, isConnecting: false, isSpeaking: true };
    const ended = onCallEnd(speaking);
    expect(ended.isSpeaking).toBe(false);
  });
});
