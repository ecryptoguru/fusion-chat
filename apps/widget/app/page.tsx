"use client";

import { Button } from "@workspace/ui/components/button";
import { useVapi } from "@/modules/widget/hooks/use-vapi";

export default function Page() {

    const { isConnected, isConnecting, isSpeaking, transcript, startCall, endCall } = useVapi();

  return (
    <div className="flex flex-col items-center justify-center min-h-svh max-w-md mx-auto w-full">
  
      <Button onClick={() => startCall()}>
        Start Call</Button>
      <Button onClick={() => endCall()} variant="destructive">
        End Call</Button>
      <p>isConnected: {`${isConnected}`}</p>
      <p>isConnecting: {`${isConnecting}`}</p>
      <p>isSpeaking: {`${isSpeaking}`}</p>
      <p>{JSON.stringify(transcript, null, 2)}</p>
    </div>
  )
}
