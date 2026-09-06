import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function AppSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!standalone || sessionStorage.getItem("librepair-splash-seen")) return;

    sessionStorage.setItem("librepair-splash-seen", "true");
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 1900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="app-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          aria-hidden="true"
        >
          <motion.div
            className="app-splash-mark"
            initial={{ opacity: 0, scale: 0.78, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 170, damping: 18 }}
          >
            <div className="app-splash-ring" />
            <img src="/logo.png" alt="" />
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
            SERVICE, SIMPLIFIED.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
