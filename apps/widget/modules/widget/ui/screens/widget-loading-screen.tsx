"use client";

import { useEffect, useState } from "react";
import { LoaderIcon } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { contactSessionIdAtomFamily, errorMessageAtom, loadingMessageAtom, organizationIdAtom, screenAtom, vapiSecretsAtom, widgetSettingsAtom } from "@/modules/widget/atoms/widget-atoms";
import { WidgetHeader } from "@/modules/widget/ui/components/widget-header";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";

type InitStep = "org" | "session" | "parallel" | "done";

export const WidgetLoadingScreen = ({ organizationId }: { organizationId: string | null }) => {
  const [step, setStep] = useState<InitStep>("org")
  const [sessionValid, setSessionValid] = useState(false);

  const loadingMessage = useAtomValue(loadingMessageAtom);
  const setWidgetSettings = useSetAtom(widgetSettingsAtom);
  const setOrganizationId = useSetAtom(organizationIdAtom);
  const setLoadingMessage = useSetAtom(loadingMessageAtom);
  const setErrorMessage = useSetAtom(errorMessageAtom);
  const setScreen = useSetAtom(screenAtom);
  const setVapiSecrets = useSetAtom(vapiSecretsAtom);

  const contactSessionId = useAtomValue(contactSessionIdAtomFamily(organizationId || ""));

  // Step 1: Validate organization (prerequisite for everything)
  const validateOrganization = useAction(api.public.organizations.validate);
  useEffect(() => {
    if (step !== "org") {
      return;
    }

    setLoadingMessage("Finding organization ID...");

    if (!organizationId) {
      setErrorMessage("Organization ID is required");
      setScreen("error");
      return;
    }

    setLoadingMessage("Verifying organization...");

    validateOrganization({ organizationId })
      .then((result) => {
        if (result.valid) {
          setOrganizationId(organizationId);
          setStep("session");
        } else {
          setErrorMessage(result.reason || "Invalid configuration");
          setScreen("error");
        }
      })
      .catch(() => {
        setErrorMessage("Unable to verify organization");
        setScreen("error");
      });
  }, [
    step,
    organizationId,
    setErrorMessage,
    setScreen,
    setOrganizationId,
    setStep,
    validateOrganization,
    setLoadingMessage
  ]);

  // Step 2: Validate session (if exists)
  const validateContactSession = useMutation(api.public.contactSessions.validate);
  useEffect(() => {
    if (step !== "session") {
      return;
    }

    setLoadingMessage("Finding contact session ID...");

    if (!contactSessionId) {
      setSessionValid(false);
      // Parallelize steps 3 and 4 after step 1 completes
      setStep("parallel");
      return;
    }

    setLoadingMessage("Validating session...");

    validateContactSession({ contactSessionId })
      .then((result) => {
        setSessionValid(result.valid);
        setStep("parallel");
      })
      .catch(() => {
        setSessionValid(false);
        setStep("parallel");
      });
  }, [step, contactSessionId, validateContactSession, setLoadingMessage]);

  // Step 3 & 4: Parallelized - Load Widget Settings and Vapi secrets
  const widgetSettings = useQuery(api.public.widgetSettings.getByOrganizationId, 
    organizationId ? {
      organizationId,
    } : "skip",
  );
  
  const getVapiSecrets = useAction(api.public.secrets.getVapiSecrets);
  
  const [vapiSecretsLoaded, setVapiSecretsLoaded] = useState(false);
  
  useEffect(() => {
    if (step !== "parallel") {
      return;
    }

    setLoadingMessage("Loading widget settings and voice features...");

    if (widgetSettings !== undefined) {
      setWidgetSettings(widgetSettings);
    }

    if (!organizationId) {
      setErrorMessage("Organization ID is required");
      setScreen("error");
      return;
    }

    getVapiSecrets({ organizationId })
      .then((secrets) => {
        setVapiSecrets(secrets);
        setVapiSecretsLoaded(true);
      })
      .catch(() => {
        setVapiSecrets(null);
        setVapiSecretsLoaded(true);
      });
  }, [
    step,
    organizationId,
    widgetSettings,
    getVapiSecrets,
    setVapiSecrets,
    setWidgetSettings,
    setLoadingMessage,
    setStep,
    setErrorMessage,
    setScreen,
  ]);

  // Check completion of parallelized steps
  useEffect(() => {
    if (step !== "parallel") {
      return;
    }

    if (widgetSettings !== undefined && vapiSecretsLoaded) {
      setStep("done");
    }
  }, [step, widgetSettings, vapiSecretsLoaded, setStep]);

  useEffect(() => {
    if (step !== "done") {
      return;
    }

    const hasValidSession = contactSessionId && sessionValid;
    setScreen(hasValidSession ? "selection" : "auth");
  }, [step, contactSessionId, sessionValid, setScreen]);

  return (
    <>
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-2 py-6 font-semibold">
          <p className="text-3xl">
            Hi there! 👋
          </p>
          <p className="text-lg">
            Let&apos;s get you started
          </p>
        </div>
      </WidgetHeader>
      <div className="flex flex-1 flex-col items-center justify-center gap-y-4 p-4 text-muted-foreground">
        <LoaderIcon className="animate-spin" />
        <p className="text-sm">
         {loadingMessage || "Loading..."}
        </p>
      </div>
    </>
  );
};
