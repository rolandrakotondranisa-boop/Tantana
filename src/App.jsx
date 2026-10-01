import { useEffect, useRef, useState, useCallback, Component } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

/* ============================================================
   CONSTANTES & CONFIG
   ============================================================ */
const STORAGE_KEY = "ordre_mission_form_v1";
const THEME_KEY = "ordre_mission_theme";
const SESSION_KEY = "tantana_session";
const TANTANA_COORDINATOR = "TATA Frédéric Marcelin";
const LOGIN_USERS = {
  TANTANA: "230388",
  "TANTANA-2": "18mars2000",
};

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

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const sanitizedUser = username.trim();
    const sanitizedPassword = password.trim();

    if (!sanitizedUser || !sanitizedPassword) {
      setError("Veuillez remplir tous les champs pour continuer.");
      return;
    }

    const normalizedUser = sanitizedUser.toUpperCase();
    const isAllowedUser = Object.prototype.hasOwnProperty.call(LOGIN_USERS, normalizedUser);

    if (!isAllowedUser) {
      setError("Accès refusé : identifiant non autorisé.");
      return;
    }

    if (LOGIN_USERS[normalizedUser] === sanitizedPassword) {
      onLogin(normalizedUser);
      return;
    }

    setError("Mot de passe incorrect pour cet utilisateur.");
  };

  return (
    <div className="premium-shell min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="premium-card w-full max-w-5xl overflow-hidden rounded-[28px] border border-green-200/80 bg-white ring-1 ring-white/70">
        <div className="grid min-h-[680px] lg:grid-cols-2">
          <div className="premium-left-panel relative overflow-hidden bg-gradient-to-br from-green-700 via-green-800 to-green-900 p-8 sm:p-10 lg:p-12 text-white">
            <div className="premium-orb absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
            <div className="premium-orb absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-white/5" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_42%,rgba(255,255,255,0.06))]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center gap-3">
                <img src="/assets/logo.png" alt="Logo TANTANA" className="h-12 w-12 rounded-full border-2 border-white/30 bg-white/10 object-contain p-1 shadow-[0_12px_30px_rgba(16,185,129,0.35)]" />
                <span className="text-2xl font-extrabold tracking-[0.15em] uppercase">TANTANA</span>
              </div>

              <div className="space-y-5">
                <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-green-50 backdrop-blur-sm">
                  Plateforme citoyenne
                </div>
                <h1 className="max-w-md text-3xl font-extrabold leading-tight">
                  Bienvenue sur Tantana – Mpanorina ny Hoavin'i Madagasikara
                </h1>
                <p className="max-w-md text-sm leading-7 text-green-50/95">
                  Espaces citoyens de réflexion, de formation et de mobilisation, la plateforme Tantana rassemble les jeunes, leaders et citoyens engagés autour d'une vision commune : bâtir un Madagascar prospère, transparent et inclusif. À travers la promotion de la bonne gouvernance, du développement durable, des droits humains et de l'innovation numérique, nous cultivons le leadership civique et la cohésion sociale basés sur l'intégrité, la redevabilité et la solidarité. Connectez-vous pour rejoindre le mouvement et façonner l'avenir de notre nation.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 p-8 sm:p-10 lg:p-12">
            <div className="mx-auto flex h-full max-w-md flex-col justify-center">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-green-50 text-green-800 shadow-[0_10px_22px_rgba(34,197,94,0.18)] ring-1 ring-green-200">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-green-700">Accès</p>
                  <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-semibold text-gray-700">
                    Identifiant
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input"
                    placeholder="TANTANA"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pr-12"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="premium-icon-button absolute inset-y-1 right-1 flex w-10 items-center justify-center rounded-xl text-gray-500"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 012.4-4.059M6.42 6.42A9.96 9.96 0 0112 5c4.477 0 8.268 2.943 9.543 7a9.955 9.955 0 01-4.166 5.34M9.88 9.88A3 3 0 0114.12 14.12M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-9 0c1.4-3.6 4.4-6 9-6s7.6 2.4 9 6c-1.4 3.6-4.4 6-9 6s-7.6-2.4-9-6z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="premium-button w-full rounded-[18px] bg-gradient-to-r from-green-700 via-green-600 to-green-500 px-4 py-3.5 text-base font-semibold text-white"
                >
                  Se connecter
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center border-2 border-green-600">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Une erreur est survenue
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              {this.state.error?.message || "Erreur inattendue"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-green-700 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-800 transition-colors"
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

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  const styles = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-amber-500 text-white",
    info: "bg-green-800 text-white",
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
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in border-2 border-green-600"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="modal-title" className="text-lg font-bold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl font-semibold text-white transition-colors ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-700 hover:bg-green-800"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, error, hint, children }) {
  return (
    <div className="block">
      <label className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-600" aria-hidden="true">*</span>}
        </span>
        {hint && <span className="text-xs text-gray-500">{hint}</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1 animate-fade-in" role="alert">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function SafeImage({ src, alt, className, fallbackText = "Image" }) {
  const [hasError, setHasError] = useState(false);
  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 text-gray-400 text-xs`}>
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
  const [sessionUser, setSessionUser] = useState(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored).user || null : null;
    } catch {
      return null;
    }
  });
  const [form, setForm] = usePersistedState(STORAGE_KEY, initialForm);
  const [loading, setLoading] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { isDark, toggle } = useTheme();
  const { toasts, push: pushToast, remove: removeToast } = useToast();
  const documentRef = useRef(null);
  const previewFrameRef = useRef(null);
  const fieldRefs = useRef({});

  // Date formatée pour le PDF (ex: "28 septembre 2026")
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const coordinatorName = sessionUser === "TANTANA"
    ? TANTANA_COORDINATOR
    : form.Coordinateur;

  useEffect(() => {
    if (sessionUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user: sessionUser }));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [sessionUser]);

  useEffect(() => {
    if (sessionUser === "TANTANA" && form.Coordinateur !== TANTANA_COORDINATOR) {
      setForm((previous) => ({ ...previous, Coordinateur: TANTANA_COORDINATOR }));
    }
  }, [sessionUser, form.Coordinateur, setForm]);

  const handleLogin = useCallback((user) => {
    setSessionUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    setLogoutDialogOpen(false);
    setSessionUser(null);
    setErrors({});
    setTouched({});
    pushToast("Déconnexion réussie", "info");
  }, [pushToast]);

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
    setForm({ ...initialForm });
    setErrors({});
    setTouched({});
    setResetModalOpen(false);
    pushToast("Formulaire réinitialisé", "success");
  }, [setForm, pushToast]);

  const focusFirstError = useCallback((errorFields) => {
    const first = errorFields[0];
    if (first && fieldRefs.current[first]) {
      fieldRefs.current[first].focus();
      fieldRefs.current[first].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const generatePdf = useCallback(async () => {
    const currentForm = { ...form };

    const newErrors = {};
    const newTouched = {};
    const errorFields = [];

    REQUIRED_FIELDS.forEach(({ key }) => {
      newTouched[key] = true;
      const error = validateField(key, currentForm[key]);
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

    if (currentForm.dateDebut && currentForm.dateFin && currentForm.dateFin < currentForm.dateDebut) {
      pushToast("La date de fin doit être postérieure à la date de début", "error");
      return;
    }

    if (!documentRef.current) {
      pushToast("L'aperçu n'est pas disponible. Rechargez la page.", "error");
      return;
    }

    try {
      setLoading(true);

      const source = documentRef.current;
      const clone = source.cloneNode(true);
      clone.style.position = "fixed";
      clone.style.left = "0";
      clone.style.top = "0";
      clone.style.width = "794px";
      clone.style.height = "1123px";
      clone.style.transform = "none";
      clone.style.boxShadow = "none";
      clone.style.border = "0";
      clone.style.margin = "0";
      clone.style.padding = "0";
      clone.style.background = "#ffffff";
      clone.style.zIndex = "-1";
      clone.style.opacity = "1";
      // Assurer que les styles de police sont bien appliqués au clone
      clone.style.fontFamily = "'Times New Roman', Times, serif";
      clone.style.fontSize = "12pt";
      clone.style.lineHeight = "1.5";

      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.left = "-9999px";
      wrapper.style.top = "0";
      wrapper.style.width = "794px";
      wrapper.style.height = "1123px";
      wrapper.style.overflow = "hidden";
      wrapper.style.background = "#ffffff";
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      const canvas = await html2canvas(clone, {
        scale: 2,
        width: 794,
        height: 1123,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      wrapper.remove();

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      pdf.addImage(imgData, "PNG", 0, 0, 210, 297, undefined, "FAST");

      const filename = `Ordre_de_Mission_${sanitizeFilename(currentForm.nomPrenom)}.pdf`;
      pdf.save(filename);

      pushToast("PDF généré avec succès !", "success");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      pushToast("Erreur lors de la génération du PDF. Réessayez.", "error");
    } finally {
      setLoading(false);
    }
  }, [form, pushToast, focusFirstError]);

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

  const filledCount = REQUIRED_FIELDS.filter(({ key }) => (form[key] || "").toString().trim()).length;
  const progress = (filledCount / REQUIRED_FIELDS.length) * 100;
  const isFormValid = filledCount === REQUIRED_FIELDS.length && !Object.values(errors).some(Boolean);

  if (!sessionUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300">
        <header className="no-print sticky top-0 z-30 border-b-2 border-green-600 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:py-4 gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-bold truncate text-green-800">
                Générateur d'Ordre de Mission
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                Plateforme TANTANA - Région Haute Matsiatra
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden md:flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200 shadow-sm">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6z" clipRule="evenodd" />
                </svg>
                A4
              </div>
              <button
                onClick={() => setLogoutDialogOpen(true)}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
              >
                Déconnexion
              </button>
              <button
                onClick={toggle}
                className="p-2 rounded-lg bg-white hover:bg-green-50 transition-colors border border-green-200 shadow-sm"
                aria-label="Changer de thème"
                title="Changer de thème"
              >
                <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <Dialog
          open={logoutDialogOpen}
          onClose={() => setLogoutDialogOpen(false)}
          aria-labelledby="logout-dialog-title"
          aria-describedby="logout-dialog-description"
          slotProps={{
            paper: {
              sx: {
                width: "100%",
                maxWidth: 420,
                borderRadius: 3,
                border: "1px solid rgba(21, 128, 61, 0.16)",
                boxShadow: "0 24px 70px rgba(15, 23, 42, 0.22)",
              },
            },
          }}
        >
          <DialogTitle id="logout-dialog-title" sx={{ pb: 1, fontWeight: 700, color: "#14532d" }}>
            Voulez-vous vous déconnecter ?
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="logout-dialog-description" sx={{ color: "#4b5563" }}>
              Vous devrez vous reconnecter pour accéder à nouveau au générateur.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button
              onClick={() => setLogoutDialogOpen(false)}
              sx={{ borderRadius: 2, px: 2, color: "#4b5563", textTransform: "none", fontWeight: 600 }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleLogout}
              variant="contained"
              color="error"
              sx={{ borderRadius: 2, px: 2, textTransform: "none", fontWeight: 600, boxShadow: "none" }}
            >
              Se déconnecter
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmModal
          open={resetModalOpen}
          title="Réinitialiser le formulaire ?"
          message="Toutes les informations saisies seront perdues. Cette action est irréversible."
          confirmLabel="Réinitialiser"
          danger
          onConfirm={resetForm}
          onCancel={() => setResetModalOpen(false)}
        />

        <main className="mx-auto max-w-7xl px-4 py-4 sm:py-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
            <section className="no-print h-fit rounded-2xl bg-white p-4 sm:p-5 shadow-[0_18px_45px_rgba(21,128,61,0.08)] ring-2 ring-green-600/20 border border-green-100">
              <div className="mb-4 border-b-2 border-green-600 pb-3">
                <h2 className="text-base sm:text-lg font-bold text-green-800">Informations</h2>
                <p className="mt-1 text-xs sm:text-sm text-gray-600">
                  Les données sont sauvegardées automatiquement.
                </p>
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">
                    Progression
                  </span>
                  <span className="text-xs font-bold tabular-nums text-green-700">
                    {filledCount}/{REQUIRED_FIELDS.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden border border-gray-300">
                  <div
                    className={`h-full transition-all duration-500 ease-out rounded-full ${
                      progress === 100
                        ? "bg-gradient-to-r from-green-600 to-green-500"
                        : "bg-gradient-to-r from-green-700 to-green-600"
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
                    value={coordinatorName}
                    readOnly={sessionUser === "TANTANA"}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ex. TATA Frédéric Marcelin"
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

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={generatePdf}
                  disabled={loading}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-green-700 to-green-600 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 border-2 border-green-800"
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
                  className="rounded-xl border-2 border-red-600 bg-white px-4 py-3 font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-[0.98]"
                >
                  Réinitialiser
                </button>
              </div>
            </section>

            <section className="min-w-0">
              <div className="no-print mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-800">Aperçu</h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Mise à jour en temps réel
                  </p>
                </div>
                {isFormValid && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Prêt
                  </span>
                )}
              </div>

              <div className="rounded-2xl bg-green-50 p-2 sm:p-6 shadow-inner border-2 border-green-200">
                <div
                  ref={previewFrameRef}
                  className="relative mx-auto w-full max-w-[794px] overflow-hidden bg-white shadow-[0_20px_45px_rgba(15,23,42,0.08)]"
                  style={{ height: `${1123 * previewScale}px` }}
                >
                  {/* CONTENEUR PRINCIPAL DU DOCUMENT AVEC POLICE TIMES NEW ROMAN, 12PT, 1.5 */}
                  <div
                    ref={documentRef}
                    className="relative h-[1123px] w-[794px] origin-top-left overflow-hidden bg-white text-black"
                    style={{ 
                      transform: `scale(${previewScale})`,
                      fontFamily: "'Times New Roman', Times, serif",
                      fontSize: "12pt",
                      lineHeight: "1.5"
                    }}
                  >
                    <SafeImage
                      src="/assets/logo.png"
                      alt="Logo"
                      fallbackText="Logo"
                      className="absolute left-1/2 top-[58px] h-[82px] w-[82px] -translate-x-1/2 object-contain"
                    />

                    <div className="absolute left-0 right-0 top-[142px] text-center" style={{ fontSize: "12pt", lineHeight: "1.5" }}>
                      <div className="font-bold text-green-800">Plateforme TANTANA</div>
                      <div className="mt-1 italic text-red-600">
                        Mpanarina ny hoavin'i Madagasikara
                      </div>
                      <div className="mt-2 font-semibold">
                        Région haute Matsiatra
                      </div>
                    </div>

                    <div className="absolute left-0 right-0 top-[225px] text-center" style={{ fontSize: "12pt", lineHeight: "1.5" }}>
                      <div className="font-bold tracking-[0.65em] text-green-800">
                        O b j e t : &nbsp; O r d r e &nbsp; d e s &nbsp; M i s s i o n s
                      </div>
                    </div>

                    <div
                      className="absolute left-[82px] right-[75px] top-[315px]"
                      style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "12pt", lineHeight: "1.5" }}
                    >
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

                    {/* SIGNATURE DU COORDINATEUR (GAUCHE) */}
                    <div className="absolute bottom-[150px] left-[95px] text-center">
                      <div className="text-[12pt] font-semibold">
                        Coordinateur :{" "}
                        <span className="font-bold">
                          {coordinatorName || "________________________________________"}
                        </span>
                      </div>
                      {sessionUser === "TANTANA" && (
                        <SafeImage
                          src="/assets/Signature.png"
                          alt="Signature de TATA Frédéric Marcelin"
                          fallbackText="Signature"
                          className="mx-auto mt-1 h-[120px] w-[240px] object-contain"
                        />
                      )}
                    </div>

                    {/* DATE AU-DESSUS DU TAMPON (DROITE) */}
                    <div className="absolute bottom-[270px] right-[92px] text-center w-[165px]">
                      <div className="text-[12pt] font-semibold italic">
                        Ny anio, le {currentDate}
                      </div>
                    </div>

                    {/* TAMPON (DROITE) */}
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