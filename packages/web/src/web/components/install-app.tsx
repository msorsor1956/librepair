import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const markInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  const install = async () => {
    if (!prompt) {
      setShowHelp(true);
      return;
    }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setPrompt(null);
  };

  if (installed) {
    return (
      <div className="install-ready" role="status">
        <Smartphone size={19} aria-hidden="true" />
        LIBrepair is installed and ready.
      </div>
    );
  }

  return (
    <div className="install-panel">
      <div>
        <span className="install-kicker">MOBILE APP</span>
        <h2>Keep your garage in your pocket.</h2>
        <p>Install LIBrepair on iPhone or Android for fast, full-screen access with no app-store search.</p>
      </div>
      <button type="button" className="install-button" onClick={install}>
        <Download size={19} aria-hidden="true" />
        Install LIBrepair
      </button>

      {showHelp && (
        <div className="install-dialog" role="dialog" aria-modal="true" aria-labelledby="install-title">
          <button type="button" className="install-close" onClick={() => setShowHelp(false)} aria-label="Close install instructions">
            <X size={20} />
          </button>
          <Smartphone size={30} aria-hidden="true" />
          <h3 id="install-title">Install on your phone</h3>
          <p><strong>iPhone:</strong> Open this site in Safari, tap <Share size={15} className="inline" aria-hidden="true" /> Share, then choose Add to Home Screen.</p>
          <p><strong>Android:</strong> Open the browser menu and choose Install app or Add to Home screen.</p>
          <button type="button" className="install-done" onClick={() => setShowHelp(false)}>Got it</button>
        </div>
      )}
    </div>
  );
}
