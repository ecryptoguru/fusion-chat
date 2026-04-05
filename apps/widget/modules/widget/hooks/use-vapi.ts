import Vapi from "@vapi-ai/web";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { vapiSecretsAtom, widgetSettingsAtom } from "../atoms/widget-atoms";

interface TranscriptMessage {
  role: "user" | "assistant";
  text: string;
};

export const useVapi = () => {
  const vapiSecrets = useAtomValue(vapiSecretsAtom);
  const widgetSettings = useAtomValue(widgetSettingsAtom);

  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);

  useEffect(() => {
    if (!vapiSecrets?.publicApiKey) {
      return;
    }

    const vapiInstance = new Vapi(vapiSecrets.publicApiKey);
    setVapi((prev) => {
      if (prev) prev.stop();
      return vapiInstance;
    });

    const handleCallStart = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setTranscript([]);
    };

    const handleCallEnd = () => {
      setIsConnected(false);
      setIsConnecting(false);
      setIsSpeaking(false);
    };

    const handleSpeechStart = () => setIsSpeaking(true);
    const handleSpeechEnd = () => setIsSpeaking(false);

    const handleError = (error: unknown) => {
      console.log(error, "VAPI_ERROR");
      setIsConnecting(false);
    };

    const handleMessage = (message: { type: string; transcriptType?: string; role?: string; transcript?: string }) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const transcript = message.transcript;
        if (!transcript) return;
        setTranscript((prev) => [
          ...prev,
          {
            role: message.role === "user" ? "user" : "assistant",
            text: transcript,
          }
        ]);
      }
    };

    vapiInstance.on("call-start", handleCallStart);
    vapiInstance.on("call-end", handleCallEnd);
    vapiInstance.on("speech-start", handleSpeechStart);
    vapiInstance.on("speech-end", handleSpeechEnd);
    vapiInstance.on("error", handleError);
    vapiInstance.on("message", handleMessage);

    return () => {
      vapiInstance.off("call-start", handleCallStart);
      vapiInstance.off("call-end", handleCallEnd);
      vapiInstance.off("speech-start", handleSpeechStart);
      vapiInstance.off("speech-end", handleSpeechEnd);
      vapiInstance.off("error", handleError);
      vapiInstance.off("message", handleMessage);
      vapiInstance.stop();
    };
  }, [vapiSecrets?.publicApiKey]);

  const startCall = () => {
    if (!vapiSecrets || !widgetSettings?.vapiSettings?.assistantId) {
      return;
    }
    setIsConnecting(true);

    if (vapi) {
      vapi.start(widgetSettings.vapiSettings.assistantId);
    }
  }

  const endCall = () => {
    if (vapi) {
      vapi.stop();
    }
  };

  return {
    isSpeaking,
    isConnecting,
    isConnected,
    transcript,
    startCall,
    endCall,
  }
};