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
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let active = true;

    if (!clientId) return () => { active = false; };

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
  }, [clientId, mode]);

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span>Or continue with</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="relative min-h-11 overflow-hidden rounded-lg border border-border bg-white shadow-sm transition hover:border-muted-foreground/40">
        {clientId ? (
          <div ref={buttonRef} className="flex min-h-11 justify-center" />
        ) : (
          <button
            type="button"
            disabled
            title="Google sign-in is not configured yet"
            className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 bg-white px-4 text-sm font-medium text-slate-500 opacity-75"
          >
            <GoogleMark />
            <span>{mode === "signup_with" ? "Sign up with Google" : "Sign in with Google"}</span>
          </button>
        )}
      </div>
      {!clientId && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Google sign-in isn’t available yet. You can continue with the form above.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-center text-xs text-muted-foreground">
          {error} You can still use the form above.
        </p>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.93c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.41 37.96 46.98 31.84 46.98 24.55Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.45-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.2C6.51 42.62 14.62 48 24 48Z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.2a23.9 23.9 0 0 0 0 21.58l7.98-6.2Z" />
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
    </svg>
  );
}
