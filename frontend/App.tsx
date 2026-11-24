// =============================================================================
// LexPortal Frontend - Główny Komponent Aplikacji (App.tsx)
// =============================================================================
//
// Ten plik jest sercem aplikacji frontendowej. Odpowiada za:
//   - Definiowanie globalnej struktury i layoutu strony.
//   - Konfigurację routingu za pomocą `react-router-dom`.
//   - Leniwe ładowanie (lazy loading) poszczególnych stron dla optymalizacji.
//   - Zarządzanie globalnymi dostawcami kontekstu (np. `ThemeProvider`).
//   - Wyświetlanie modala zgody na cookies/RODO.
//   - Ochronę wybranych tras, wymagających uwierzytelnienia.
//
// =============================================================================

import React, { useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Toaster } from "sonner";
import { ThemeProvider } from "./context/ThemeContext";
import { ShieldCheck } from "lucide-react";
import { OmniSearch } from "./components/OmniSearch";

import Home from "./pages/Home";
import { DashboardSkeleton } from "./components/Skeleton";

// ---------------------------------------------------------------------------
// Leniwe Ładowanie Stron (Code Splitting)
// ---------------------------------------------------------------------------
// `React.lazy` pozwala na dynamiczne importowanie komponentów (stron).
// Dzięki temu kod każdej strony jest ładowany dopiero wtedy, gdy użytkownik
// na nią przechodzi, co znacząco skraca czas początkowego ładowania aplikacji.
// ---------------------------------------------------------------------------
const Resources = React.lazy(() => import("./pages/Resources"));
const AIAssistant = React.lazy(() => import("./pages/AIAssistant"));
const DocumentAnalysis = React.lazy(() => import("./pages/DocumentAnalysis"));
const KnowledgeBase = React.lazy(() => import("./pages/KnowledgeBase"));
const ClientDashboard = React.lazy(() => import("./pages/ClientDashboard"));
const LawyerDashboard = React.lazy(() => import("./pages/LawyerDashboard"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Cases = React.lazy(() => import("./pages/Cases"));
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));
const Payment = React.lazy(() => import("./pages/Payment"));
const PaymentStatus = React.lazy(() => import("./pages/PaymentStatus"));
const Help = React.lazy(() => import("./pages/Help"));
const Services = React.lazy(() => import("./pages/Services"));
const About = React.lazy(() => import("./pages/About"));
const Career = React.lazy(() => import("./pages/Career"));
const Blog = React.lazy(() => import("./pages/Blog"));
const Contact = React.lazy(() => import("./pages/Contact"));
const Terms = React.lazy(() =>
  import("./pages/Legal").then((m) => ({ default: m.Terms })),
);
const Privacy = React.lazy(() =>
  import("./pages/Legal").then((m) => ({ default: m.Privacy })),
);
const GDPR = React.lazy(() =>
  import("./pages/Legal").then((m) => ({ default: m.GDPR })),
);
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const DocumentLibrary = React.lazy(() => import("./pages/DocumentLibrary"));
const PlatformGuide = React.lazy(() => import("./pages/PlatformGuide"));
const DocumentCreator = React.lazy(() => import("./pages/DocumentCreator"));
const SalesDashboard = React.lazy(() => import("./pages/SalesDashboard"));
const ClientDocumentWizard = React.lazy(
  () => import("./pages/ClientDocumentWizard"),
);

// ---------------------------------------------------------------------------
// Komponent Ładowania (Fallback)
// ---------------------------------------------------------------------------
// Wyświetlany tymczasowo, podczas gdy leniwie ładowany komponent jest
// pobierany i renderowany. Użycie "szkieletu" (skeleton) poprawia UX.
// ---------------------------------------------------------------------------
const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
    <DashboardSkeleton />
  </div>
);

// ---------------------------------------------------------------------------
// Modal Zgody na Przetwarzanie Danych (RODO/Cookies)
// ---------------------------------------------------------------------------
// Wyświetla modal przy pierwszej wizycie użytkownika. Zgoda jest zapisywana
// w `localStorage`, aby nie pokazywać go ponownie.
// ---------------------------------------------------------------------------
const ComplianceModal = () => {
  const [show, setShow] = useState(
    () => !localStorage.getItem("lexportal_consent"),
  );

  const handleAccept = () => {
    localStorage.setItem("lexportal_consent", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center pointer-events-none p-4">
      <div className="absolute inset-0 bg-black/50 pointer-events-auto backdrop-blur-sm" />
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl pointer-events-auto relative z-10 overflow-hidden animate-in slide-in-from-bottom-10">
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="bg-slate-900 p-3 rounded-full text-amber-500 shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Dbamy o Twoją prywatność i bezpieczeństwo
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Szanujemy Twoje dane. Zgodnie z RODO (GDPR) oraz Prawem
                Telekomunikacyjnym informujemy, że serwis LexPortal wykorzystuje
                pliki cookies w celu zapewnienia prawidłowego działania systemu,
                bezpieczeństwa sesji oraz analizy ruchu.
              </p>
              {/* ... reszta treści modala ... */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAccept}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 flex-1"
                >
                  Akceptuję i przechodzę do serwisu
                </button>
                <Link
                  to="/privacy"
                  onClick={() => setShow(false)}
                  className="px-6 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors text-center"
                >
                  Polityka Prywatności
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Komponent Ochrony Tras (Higher-Order Component)
// ---------------------------------------------------------------------------
// Sprawdza, czy użytkownik jest zalogowany (na podstawie `localStorage`).
// Jeśli nie, przekierowuje na stronę logowania, zapamiętując pierwotną
// lokalizację, aby móc na nią wrócić po pomyślnym zalogowaniu.
// ---------------------------------------------------------------------------
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const hasToken = Boolean(localStorage.getItem("token"));

  if (!isLoggedIn && !hasToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

// =============================================================================
// Główny Komponent Aplikacji
// =============================================================================
const App: React.FC = () => {
  return (
    // `HashRouter` jest używany dla uproszczenia deploymentu na statycznych
    // serwerach bez konieczności konfiguracji po stronie serwera.
    <HashRouter>
      <ThemeProvider>
        <Toaster position="top-right" richColors />
        <div className="min-h-screen flex flex-col">
          <ComplianceModal />
          <OmniSearch />
          <NavbarWrapper />
          <main className="grow">
            {/* `React.Suspense` jest wymagany do obsługi leniwego ładowania.
                Wyświetla `fallback`, dopóki komponent nie zostanie załadowany. */}
            <React.Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Trasy publiczne */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/payment/status" element={<PaymentStatus />} />
                <Route
                  path="/document-analysis"
                  element={<DocumentAnalysis />}
                />
                <Route path="/knowledge-base" element={<KnowledgeBase />} />
                <Route path="/help" element={<Help />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:category" element={<Services />} />
                <Route path="/about" element={<About />} />
                <Route path="/career" element={<Career />} />
                <Route path="/careers" element={<Navigate to="/career" replace />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/gdpr" element={<GDPR />} />
                <Route
                  path="/polityka-prywatnosci"
                  element={<PrivacyPolicy />}
                />
                <Route path="/wzory-dokumentow" element={<DocumentLibrary />} />
                <Route path="/przewodnik" element={<PlatformGuide />} />

                {/* Trasy chronione */}
                <Route
                  path="/resources"
                  element={
                    <RequireAuth>
                      <Resources />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/assistant"
                  element={
                    <RequireAuth>
                      <AIAssistant />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/cases"
                  element={
                    <RequireAuth>
                      <Cases />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/client-dashboard"
                  element={
                    <RequireAuth>
                      <ClientDashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/lawyer-dashboard"
                  element={
                    <RequireAuth>
                      <LawyerDashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin-dashboard"
                  element={
                    <RequireAuth>
                      <AdminDashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin-analytics"
                  element={
                    <RequireAuth>
                      <SalesDashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <RequireAuth>
                      <Profile />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/document-creator"
                  element={
                    <RequireAuth>
                      <DocumentCreator />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/document-wizard"
                  element={
                    <RequireAuth>
                      <ClientDocumentWizard />
                    </RequireAuth>
                  }
                />
              </Routes>
            </React.Suspense>
          </main>
          <FooterWrapper />
        </div>
      </ThemeProvider>
    </HashRouter>
  );
};

// ---------------------------------------------------------------------------
// Warunkowe Renderowanie Komponentów UI
// ---------------------------------------------------------------------------
// Te komponenty (wrappery) decydują, czy pokazać `Navbar` i `Footer`.
// Ukrywają je na stronach dashboardów, aby zapewnić więcej miejsca
// na treść i bardziej "aplikacyjny" wygląd.
// ---------------------------------------------------------------------------
const NavbarWrapper: React.FC = () => {
  const location = useLocation();
  const dashboardPaths = [
    "/client-dashboard",
    "/lawyer-dashboard",
    "/admin-dashboard",
    "/document-wizard",
  ];
  if (dashboardPaths.includes(location.pathname)) return null;
  return <Navbar />;
};

const FooterWrapper: React.FC = () => {
  const location = useLocation();
  const dashboardPaths = [
    "/client-dashboard",
    "/lawyer-dashboard",
    "/admin-dashboard",
    "/document-wizard",
  ];
  if (dashboardPaths.includes(location.pathname)) return null;
  return <Footer />;
};

export default App;
