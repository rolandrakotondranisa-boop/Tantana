import { useEffect, useRef, useState, useCallback, Component } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/* ============================================================
   CONSTANTES & CONFIG
   ============================================================ */
const STORAGE_KEY = "ordre_mission_form_v1";
const THEME_KEY = "ordre_mission_theme";

const initialForm = {
  civilite: "Mme",
  nomPrenom: "",
  cin: "",
  adresse: "",
  Motif: "",
  Coordinateur: "",
  dateDebut: "",
  dateFin: "",
};

const REQUIRED_FIELDS = [
  { key: "nomPrenom", label: "Nom et prénom" },
  { key: "cin", label: "CIN" },
  { key: "adresse", label: "Adresse" },
  { key: "Motif", label: "Motif" },
  { key: "Coordinateur", label: "Coordinateur" },
];

/* ============================================================
   HOOKS PERSONNALISÉS
   ============================================================ */

// Hook pour état persisté (localStorage)
function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn("Impossible de sauvegarder dans localStorage", e);
    }
  }, [key, state]);

  return [state, setState];
}

// Hook pour le thème
function useTheme() {
  const [isDark, setIsDark] = usePersistedState(THEME_KEY, false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((v) => !v), [setIsDark]);
  return { isDark, toggle };
}

// Hook pour le système de Toast
function useToast() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, push, remove };
}

/* ============================================================
   ERROR BOUNDARY
   ============================================================ */
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Une erreur est survenue
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
              {this.state.error?.message || "Erreur inattendue"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 dark:bg-slate-700 text-white px-4 py-3 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ============================================================
   UTILITAIRES
   ============================================================ */
function formatDate(value) {
  if (!value) return "____/____/____";
  const parts = value.split("-");
  if (parts.length !== 3) return "____/____/____";
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

function sanitizeFilename(name) {
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .slice(0, 50) || "document";
}

function validateField(name, value) {
  const trimmed = (value || "").toString().trim();
  switch (name) {
    case "nomPrenom":
      if (!trimmed) return "Le nom est requis";
      if (trimmed.length < 2) return "Minimum 2 caractères";
      return "";
    case "cin": {
      const digits = (value || "").replace(/\D/g, "");
      if (!digits) return "Le CIN est requis";
      if (digits.length !== 12) return `12 chiffres requis (${digits.length}/12)`;
      return "";
    }
    case "adresse":
      if (!trimmed) return "L'adresse est requise";
      if (trimmed.length < 5) return "Minimum 5 caractères";
      return "";
    case "Motif":
      if (!trimmed) return "Le motif est requis";
      return "";
    case "Coordinateur":
      if (!trimmed) return "Le coordinateur est requis";
      return "";
    default:
      return "";
  }
}

/* ============================================================
   COMPOSANTS UI
   ============================================================ */

// Toast Container
function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  const styles = {
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-amber-500 text-white",
    info: "bg-slate-800 dark:bg-slate-700 text-white",
  };
  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl animate-slide-in ${styles[toast.type] || styles.info}`}
        >
          <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Fermer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// Modal de confirmation
function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = "Confirmer", danger = false }) {
  if (!open) return null;
  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl font-semibold text-white transition-colors ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Champ de formulaire
function Field({ label, required, error, hint, children }) {
  return (
    <div className="block">
      <label className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
        </span>
        {hint && <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 animate-fade-in" role="alert">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

// Image avec fallback
function SafeImage({ src, alt, className, fallbackText = "Image" }) {
  const [hasError, setHasError] = useState(false);
  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400 text-xs`}>
        {fallbackText}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

/* ============================================================
   COMPOSANT PRINCIPAL
   ============================================================ */
function App() {
  const [form, setForm] = usePersistedState(STORAGE_KEY, initialForm);
  const [loading, setLoading] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const { isDark, toggle } = useTheme();
  const { toasts, push: pushToast, remove: removeToast } = useToast();

  const documentRef = useRef(null);
  const previewFrameRef = useRef(null);
  const fieldRefs = useRef({});

  // Resize Observer avec debounce
  useEffect(() => {
    const frame = previewFrameRef.current;
    if (!frame) return;

    let timeoutId;
    const updateScale = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = frame.clientWidth;
        setPreviewScale(Math.min(1, Math.max(0.3, width / 794)));
      }, 50);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  // Validation en temps réel
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    let safeValue = value;

    if (name === "cin") {
      const digits = value.replace(/\D/g, "").slice(0, 12);
      safeValue = digits.match(/.{1,3}/g)?.join(" ") ?? "";
    } else if (name === "nomPrenom" || name === "Coordinateur") {
      safeValue = value.replace(/[^\p{L}\p{M}\s'’-]/gu, "").slice(0, 100);
    } else if (name === "adresse" || name === "Motif") {
      safeValue = value.slice(0, 300);
    }

    setForm((prev) => ({ ...prev, [name]: safeValue }));

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, safeValue) }));
    }
  }, [setForm, touched]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setErrors({});
    setTouched({});
    setResetModalOpen(false);
    pushToast("Formulaire réinitialisé", "success");
  }, [setForm, pushToast]);

  // Focus sur le premier champ en erreur
  const focusFirstError = useCallback((errorFields) => {
    const first = errorFields[0];
    if (first && fieldRefs.current[first]) {
      fieldRefs.current[first].focus();
      fieldRefs.current[first].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Génération PDF
  const generatePdf = useCallback(async () => {
    // 1. Validation complète
    const newErrors = {};
    const newTouched = {};
    const errorFields = [];

    REQUIRED_FIELDS.forEach(({ key }) => {
      newTouched[key] = true;
      const error = validateField(key, form[key]);
      if (error) {
        newErrors[key] = error;
        errorFields.push(key);
      }
    });

    setErrors(newErrors);
    setTouched(newTouched);

    if (errorFields.length) {
      pushToast(`Veuillez corriger ${errorFields.length} champ${errorFields.length > 1 ? "s" : ""}`, "error");
      focusFirstError(errorFields);
      return;
    }

    // 2. Validation dates
    if (form.dateDebut && form.dateFin && form.dateFin < form.dateDebut) {
      pushToast("La date de fin doit être postérieure à la date de début", "error");
      return;
    }

    if (!documentRef.current) {
      pushToast("L'aperçu n'est pas disponible. Rechargez la page.", "error");
      return;
    }

    // 3. Génération
    try {
      setLoading(true);
      const element = documentRef.current;
      const originalTransform = element.style.transform;
      element.style.transform = "none";

      let canvas;
      try {
        canvas = await html2canvas(element, {
          scale: 2,
          width: 794,
          height: 1123,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
      } finally {
        element.style.transform = originalTransform;
      }

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
      const filename = `Ordre_de_Mission_${sanitizeFilename(form.nomPrenom)}.pdf`;
      pdf.save(filename);

      pushToast("PDF généré avec succès !", "success");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      pushToast("Erreur lors de la génération du PDF. Réessayez.", "error");
    } finally {
      setLoading(false);
    }
  }, [form, pushToast, focusFirstError]);

  // Raccourci clavier Ctrl/Cmd + Enter
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        generatePdf();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [generatePdf]);

  // Progression
  const filledCount = REQUIRED_FIELDS.filter(({ key }) => (form[key] || "").toString().trim()).length;
  const progress = (filledCount / REQUIRED_FIELDS.length) * 100;
  const isFormValid = filledCount === REQUIRED_FIELDS.length && !Object.values(errors).some(Boolean);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        {/* HEADER */}
        <header className="no-print sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:py-4 gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-bold truncate">
                Générateur d'Ordre de Mission
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                Remplissez le formulaire puis générez le PDF
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden md:flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6z" clipRule="evenodd" />
                </svg>
                A4
              </div>
              <button
                onClick={toggle}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
                title={isDark ? "Mode clair" : "Mode sombre"}
              >
                {isDark ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-slate-700 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* TOASTS */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* MODAL RESET */}
        <ConfirmModal
          open={resetModalOpen}
          title="Réinitialiser le formulaire ?"
          message="Toutes les informations saisies seront perdues. Cette action est irréversible."
          confirmLabel="Réinitialiser"
          danger
          onConfirm={resetForm}
          onCancel={() => setResetModalOpen(false)}
        />

        {/* MAIN */}
        <main className="mx-auto max-w-7xl px-4 py-4 sm:py-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
            {/* FORMULAIRE */}
            <section className="no-print h-fit rounded-2xl bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
              <div className="mb-4">
                <h2 className="text-base sm:text-lg font-bold">Informations</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Les données sont sauvegardées automatiquement.
                </p>
              </div>

              {/* PROGRESSION */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Progression
                  </span>
                  <span className="text-xs font-bold tabular-nums">
                    {filledCount}/{REQUIRED_FIELDS.length}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out rounded-full ${
                      progress === 100
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                        : "bg-gradient-to-r from-blue-500 to-indigo-500"
                    }`}
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={filledCount}
                    aria-valuemin={0}
                    aria-valuemax={REQUIRED_FIELDS.length}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Field label="Civilité">
                  <select
                    name="civilite"
                    value={form.civilite}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="Mme">Mme</option>
                    <option value="M.">M.</option>
                  </select>
                </Field>

                <Field
                  label="Nom et prénom"
                  required
                  error={touched.nomPrenom && errors.nomPrenom}
                  hint={`${(form.nomPrenom || "").length}/100`}
                >
                  <input
                    ref={(el) => (fieldRefs.current.nomPrenom = el)}
                    name="nomPrenom"
                    maxLength={100}
                    value={form.nomPrenom}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ex. MAMINIAINA Daniella Judie"
                    className={`input ${touched.nomPrenom && errors.nomPrenom ? "input-error" : touched.nomPrenom && !errors.nomPrenom && form.nomPrenom ? "input-success" : ""}`}
                    aria-invalid={!!(touched.nomPrenom && errors.nomPrenom)}
                    aria-describedby={errors.nomPrenom ? "err-nomPrenom" : undefined}
                  />
                </Field>

                <Field
                  label="CIN"
                  required
                  error={touched.cin && errors.cin}
                  hint={`${form.cin.replace(/\D/g, "").length}/12`}
                >
                  <input
                    ref={(el) => (fieldRefs.current.cin = el)}
                    name="cin"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={15}
                    value={form.cin}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ex. 200 082 000 930"
                    className={`input tabular-nums ${touched.cin && errors.cin ? "input-error" : touched.cin && !errors.cin && form.cin ? "input-success" : ""}`}
                    aria-invalid={!!(touched.cin && errors.cin)}
                  />
                </Field>

                <Field
                  label="Adresse"
                  required
                  error={touched.adresse && errors.adresse}
                  hint={`${(form.adresse || "").length}/300`}
                >
                  <textarea
                    ref={(el) => (fieldRefs.current.adresse = el)}
                    name="adresse"
                    maxLength={300}
                    value={form.adresse}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={3}
                    placeholder="Ex. Région Haute Matsiatra, district..."
                    className={`input resize-none ${touched.adresse && errors.adresse ? "input-error" : touched.adresse && !errors.adresse && form.adresse ? "input-success" : ""}`}
                    aria-invalid={!!(touched.adresse && errors.adresse)}
                  />
                </Field>

                <Field
                  label="Motif"
                  required
                  error={touched.Motif && errors.Motif}
                  hint={`${(form.Motif || "").length}/300`}
                >
                  <textarea
                    ref={(el) => (fieldRefs.current.Motif = el)}
                    name="Motif"
                    maxLength={300}
                    value={form.Motif}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={3}
                    placeholder="Ex. Mission de contrôle, visite..."
                    className={`input resize-none ${touched.Motif && errors.Motif ? "input-error" : touched.Motif && !errors.Motif && form.Motif ? "input-success" : ""}`}
                    aria-invalid={!!(touched.Motif && errors.Motif)}
                  />
                </Field>

                <Field
                  label="Coordinateur"
                  required
                  error={touched.Coordinateur && errors.Coordinateur}
                  hint={`${(form.Coordinateur || "").length}/100`}
                >
                  <input
                    ref={(el) => (fieldRefs.current.Coordinateur = el)}
                    name="Coordinateur"
                    maxLength={100}
                    value={form.Coordinateur}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ex. MAMINIAINA Daniella Judie"
                    className={`input ${touched.Coordinateur && errors.Coordinateur ? "input-error" : touched.Coordinateur && !errors.Coordinateur && form.Coordinateur ? "input-success" : ""}`}
                    aria-invalid={!!(touched.Coordinateur && errors.Coordinateur)}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Date de début">
                    <input
                      type="date"
                      name="dateDebut"
                      max={form.dateFin || undefined}
                      value={form.dateDebut}
                      onChange={handleChange}
                      className="input"
                    />
                  </Field>
                  <Field label="Date de fin">
                    <input
                      type="date"
                      name="dateFin"
                      min={form.dateDebut || undefined}
                      value={form.dateFin}
                      onChange={handleChange}
                      className="input"
                    />
                  </Field>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={generatePdf}
                  disabled={loading}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-700 dark:to-slate-600 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  aria-busy={loading}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Génération...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Générer le PDF
                      </>
                    )}
                  </span>
                </button>

                <button
                  onClick={() => setResetModalOpen(true)}
                  className="rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 active:scale-[0.98]"
                >
                  Réinitialiser
                </button>
              </div>
            </section>

            {/* APERÇU */}
            <section className="min-w-0">
              <div className="no-print mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-white">Aperçu</h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Mise à jour en temps réel
                  </p>
                </div>
                {isFormValid && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Prêt
                  </span>
                )}
              </div>

              <div className="rounded-2xl bg-slate-300 dark:bg-slate-700 p-2 sm:p-6 shadow-inner">
                <div
                  ref={previewFrameRef}
                  className="relative mx-auto w-full max-w-[794px] overflow-hidden bg-white shadow-2xl"
                  style={{ height: `${1123 * previewScale}px` }}
                >
                  <div
                    ref={documentRef}
                    className="relative h-[1123px] w-[794px] origin-top-left overflow-hidden bg-white text-black"
                    style={{ transform: `scale(${previewScale})` }}
                  >
                    <SafeImage
                      src="/assets/logo.png"
                      alt="Logo"
                      fallbackText="Logo"
                      className="absolute left-1/2 top-[58px] h-[82px] w-[82px] -translate-x-1/2 object-contain"
                    />

                    <div className="absolute left-0 right-0 top-[142px] text-center">
                      <div className="text-[14px] font-bold">Plateforme TANTANA</div>
                      <div className="mt-1 text-[11px] italic text-red-600">
                        Mpanarina ny hoavin'i Madagasikara
                      </div>
                      <div className="mt-2 text-[12px] font-semibold">
                        Région haute Matsiatra
                      </div>
                    </div>

                    <div className="absolute left-0 right-0 top-[225px] text-center">
                      <div className="text-[15px] font-bold tracking-[0.65em]">
                        O b j e t : &nbsp; O r d r e &nbsp; d e s &nbsp; M i s s i o n s
                      </div>
                    </div>

                    <div className="absolute left-[82px] right-[75px] top-[315px] text-[14px] leading-[2.05]">
                      <p>
                        Amin'ny anaran'ny Plateforme TANTANA no anomezana alalana an'i {form.civilite} :{" "}
                        <span className="font-bold">{form.nomPrenom || "________________________________"}</span>,
                        CIN : <span className="font-bold">{form.cin || "____________________________"}</span>,
                        Adresse : <span className="font-bold">{form.adresse || "________________________________________"}</span>.
                        Hamita iraka ny : <span className="font-bold">{formatDate(form.dateDebut)}</span> ka hatramin'ny :{" "}
                        <span className="font-bold">{formatDate(form.dateFin)}</span> ao amin'ny{" "}
                        <span className="font-bold">{form.Motif || "________________________"}</span>.
                      </p>
                      <p className="mt-4">
                        Ity fanomezana-dalana ity dia manankery mandritr'io fotoana voalaza io
                      </p>
                    </div>

                    <div className="absolute bottom-[150px] left-[95px] text-center">
                      <div className="text-[13px] font-semibold underline">
                        Ny coordonnateur régional
                      </div>
                      <div className="mt-12 text-[12px] font-semibold">
                        Coordinateur :{" "}
                        <span className="font-bold">
                          {form.Coordinateur || "________________________________________"}
                        </span>
                      </div>
                    </div>

                    <div className="absolute bottom-[138px] right-[92px] text-center">
                      <SafeImage
                        src="/assets/tampon.png"
                        alt="Tampon"
                        fallbackText="Tampon"
                        className="mx-auto h-[125px] w-[165px] object-contain opacity-90"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;