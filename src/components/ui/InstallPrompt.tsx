import { useEffect, useState } from "react";
import { Button } from "./Button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    const alreadyDismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (alreadyDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-install-dismissed", "1");
    setDismissed(true);
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <div
      role="dialog"
      aria-label="앱 설치 안내"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 bg-primary-900 text-white rounded-xl shadow-xl p-4 flex items-center gap-3"
    >
      <div className="w-10 h-10 bg-accent-400 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">좋</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">홈 화면에 추가</div>
        <div className="text-primary-300 text-xs mt-0.5">빠른 접근을 위해 앱으로 설치하세요</div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" variant="secondary" onClick={handleDismiss} className="text-xs px-2 py-1">나중에</Button>
        <Button size="sm" onClick={handleInstall} className="text-xs px-3 py-1 bg-accent-400 hover:bg-accent-500 text-white border-0">설치</Button>
      </div>
    </div>
  );
}

export function IOSInstallGuide() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = sessionStorage.getItem("ios-install-dismissed");
    if (isIOS && !isStandalone && !dismissed) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="iOS 설치 안내"
      className="fixed bottom-4 left-4 right-4 z-50 bg-primary-900 text-white rounded-xl shadow-xl p-4"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-sm">홈 화면에 추가 (iOS)</span>
        <button
          onClick={() => { sessionStorage.setItem("ios-install-dismissed", "1"); setShow(false); }}
          className="text-primary-400 hover:text-white text-lg leading-none"
          aria-label="닫기"
        >×</button>
      </div>
      <p className="text-primary-300 text-xs leading-relaxed">
        Safari 하단의 <strong className="text-white">공유 버튼 (□↑)</strong> 을 탭한 후<br />
        <strong className="text-white">홈 화면에 추가</strong> 를 선택하세요.
      </p>
    </div>
  );
}
