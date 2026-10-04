import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleButtonOptions = {
  type: "standard";
  theme: "outline";
  size: "large";
  text: "signin_with" | "signup_with";
  shape: "rectangular";
  width: number;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select: boolean;
          }) => void;
          renderButton: (element: HTMLElement, options: GoogleButtonOptions) => void;
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | undefined;

function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      googleScriptPromise = undefined;
      reject(new Error("Google sign-in could not be loaded."));
    };
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export function GoogleAuthButton({
  mode,
  onCredential,
}: {
  mode: "signin_with" | "signup_with";
  onCredential: (idToken: string) => Promise<void>;
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [error, setError] = useState<string>();
  onCredentialRef.current = onCredential;

  useEffect(() => {
    let active = true;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setError("Google sign-in is not configured.");
      return () => {
        active = false;
      };
    }

    loadGoogleIdentityServices()
      .then(() => {
        if (!active || !buttonRef.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          callback: (response) => {
            if (!response.credential) {
              setError("Google sign-in did not return a credential. Please try again.");
              return;
            }

            setError(undefined);
            void onCredentialRef.current(response.credential).catch((cause: unknown) => {
              setError(cause instanceof Error ? cause.message : "Google sign-in failed.");
            });
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: mode,
          shape: "rectangular",
          width: Math.max(220, Math.floor(buttonRef.current.getBoundingClientRect().width)),
        });
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Google sign-in could not be loaded.");
      });

    return () => {
      active = false;
    };
  }, [mode]);

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span>or</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div ref={buttonRef} className="flex justify-center" />
      {error && (
        <p role="alert" className="mt-2 text-center text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
