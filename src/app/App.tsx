import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { LoadingScreen } from "./components/LoadingScreen";
import { OnboardingPage } from "./components/OnboardingPage";
import { AnimatePresence } from "motion/react";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("flameboard-onboarding-done"));

  useEffect(() => {
    // Show loading screen only on initial app load
    const hasSeenLoading = sessionStorage.getItem("hasSeenLoading");
    if (hasSeenLoading) {
      setLoading(false);
    }
  }, []);

  const handleLoadingFinished = () => {
    sessionStorage.setItem("hasSeenLoading", "true");
    setLoading(false);
  };

  return (
    <>
      {loading && <LoadingScreen onFinished={handleLoadingFinished} />}
      <AnimatePresence>
        {showOnboarding && !loading && (
          <OnboardingPage onFinished={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </>
  );
}