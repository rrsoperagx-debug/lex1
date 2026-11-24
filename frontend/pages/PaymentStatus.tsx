/**
 * PaymentStatus – strona powrotna po zakończeniu płatności Mollie.
 *
 * Przepływ:
 * 1. Mollie przekierowuje użytkownika na /#/payment/status?case_id=<UUID>
 * 2. Strona odczytuje case_id z URL
 * 3. Odpytuje GET /api/v1/payments/status/{caseId} co 3 sekundy (polling)
 * 4. Gdy status = paid lub is_paid = true → wyświetla sukces i zatrzymuje polling
 * 5. Gdy status = canceled/failed/expired → wyświetla błąd
 * 6. Po 60 sekundach bez odpowiedzi → wyświetla stan "oczekiwania"
 *
 * Uwaga: status może zająć kilka sekund z uwagi na asynchroniczny webhook Mollie.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
// useCallback użyte tylko dla stopPolling i resolveStatus (pure functions bez setState)
import { Link, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { paymentsApi, type PaymentStatusData } from '../services/payments';
import { ApiError } from '../services/api';

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

type UIStatus = 'loading' | 'success' | 'failed' | 'pending';

interface StatusConfig {
  icon: React.ReactNode;
  heading: string;
  message: string;
  headingColor: string;
  bgColor: string;
  borderColor: string;
}

// ---------------------------------------------------------------------------
// Konfiguracja wizualna per status
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<Exclude<UIStatus, 'loading'>, StatusConfig> = {
  success: {
    icon: <CheckCircle2 className="w-16 h-16 text-green-500" />,
    heading: 'Płatność zakończona sukcesem!',
    message:
      'Twoja sprawa jest teraz opłacona i przekazana do analizy przez naszych prawników. Otrzymasz powiadomienie, gdy analiza będzie gotowa.',
    headingColor: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  failed: {
    icon: <XCircle className="w-16 h-16 text-red-500" />,
    heading: 'Płatność nie powiodła się',
    message:
      'Płatność została anulowana lub odrzucona. Żadne środki nie zostały pobrane. Możesz spróbować ponownie.',
    headingColor: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  pending: {
    icon: <Clock className="w-16 h-16 text-amber-500" />,
    heading: 'Oczekiwanie na potwierdzenie',
    message:
      'Płatność jest w trakcie przetwarzania. Status zostanie zaktualizowany automatycznie. Możesz bezpiecznie zamknąć tę kartę i wrócić do panelu.',
    headingColor: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
};

const FAILED_STATUSES = ['canceled', 'failed', 'expired'] as const;
const POLLING_INTERVAL_MS = 3_000;   // odpytuj co 3 sekundy
const POLLING_TIMEOUT_MS  = 60_000;  // zatrzymaj polling po 60 sekundach

// ---------------------------------------------------------------------------
// Komponent
// ---------------------------------------------------------------------------

const PaymentStatus: React.FC = () => {
  const location = useLocation();

  // Odczyt case_id z parametrów URL
  const caseId = new URLSearchParams(location.search).get('case_id') ?? null;

  // Lazy initializer: jeśli brak case_id w URL od razu ustawiamy 'pending',
  // dzięki czemu nie wywołujemy setState synchronicznie wewnątrz useEffect.
  const [uiStatus, setUiStatus] = useState<UIStatus>(() =>
    caseId ? 'loading' : 'pending'
  );
  const [statusData, setStatusData] = useState<PaymentStatusData | null>(null);
  const [pollCount, setPollCount]   = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const pollingRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current)  clearInterval(pollingRef.current);
    if (timeoutRef.current)  clearTimeout(timeoutRef.current);
    pollingRef.current = null;
    timeoutRef.current = null;
  }, []);

  const resolveStatus = useCallback((data: PaymentStatusData): UIStatus => {
    if (data.is_paid || data.payment_status === 'paid') return 'success';
    if (FAILED_STATUSES.includes(data.payment_status as typeof FAILED_STATUSES[number])) {
      return 'failed';
    }
    return 'pending';
  }, []);

  useEffect(() => {
    // Lokalna flaga zapobiega setState po odmontowaniu komponentu
    let isMounted = true;

    if (!caseId) {
      // Brak case_id w URL → stan 'pending' już ustawiony przez lazy initializer useState
      return;
    }

    // Definicja fetchStatus wewnątrz efektu eliminuje ESLint warning
    // "Avoid calling setState() directly within an effect body"
    const fetchStatus = async () => {
      if (!isMounted) return;

      try {
        const data = await paymentsApi.getStatus(caseId);
        if (!isMounted) return;

        setStatusData(data);
        setFetchError(null);
        setPollCount(prev => prev + 1);

        const resolved = resolveStatus(data);
        if (resolved === 'success' || resolved === 'failed') {
          setUiStatus(resolved);
          stopPolling(); // Mamy ostateczny status – przerywamy polling
        }
        // 'pending' – kontynuuj polling
      } catch (err) {
        if (!isMounted) return;
        const msg = err instanceof ApiError ? err.message : 'Błąd połączenia z serwerem.';
        setFetchError(msg);
        // Nie przerywamy pollingu przy przejściowym błędzie sieciowym
      }
    };

    // Pierwsze odpytanie natychmiast (IIFE – nie blokuje synchronicznego ciała efektu)
    void fetchStatus();

    // Następnie polling co POLLING_INTERVAL_MS
    pollingRef.current = setInterval(() => {
      void fetchStatus();
    }, POLLING_INTERVAL_MS);

    // Timeout – po POLLING_TIMEOUT_MS przestawiamy na "pending" i zatrzymujemy
    timeoutRef.current = setTimeout(() => {
      if (isMounted) {
        setUiStatus(prev => (prev === 'loading' ? 'pending' : prev));
        stopPolling();
      }
    }, POLLING_TIMEOUT_MS);

    return () => {
      isMounted = false;
      stopPolling();
    };
  }, [caseId, resolveStatus, stopPolling]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const config = uiStatus !== 'loading' ? STATUS_CONFIG[uiStatus] : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Karta statusu */}
        <div
          className={[
            'bg-white dark:bg-gray-900 rounded-2xl shadow-lg border overflow-hidden',
            config ? config.borderColor : 'border-gray-200 dark:border-gray-800',
          ].join(' ')}
        >
          {/* Header z ikoną */}
          <div
            className={[
              'flex flex-col items-center pt-10 pb-6 px-8',
              config ? config.bgColor : 'bg-gray-50 dark:bg-gray-800/30',
            ].join(' ')}
          >
            {uiStatus === 'loading' ? (
              <>
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                  Sprawdzanie statusu płatności…
                </p>
              </>
            ) : (
              <>
                <div className="mb-4">{config!.icon}</div>
                <h1
                  className={`text-xl font-bold text-center leading-tight ${config!.headingColor}`}
                >
                  {config!.heading}
                </h1>
              </>
            )}
          </div>

          {/* Treść */}
          <div className="px-8 py-6 space-y-4">
            {uiStatus !== 'loading' && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed">
                {config!.message}
              </p>
            )}

            {/* Dane techniczne (debug) – widoczne tylko gdy jest status */}
            {statusData && (
              <div className="text-xs text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-1 font-mono">
                {statusData.mollie_id && (
                  <div className="flex justify-between">
                    <span>ID transakcji:</span>
                    <span className="text-gray-600 dark:text-gray-400 truncate ml-2 max-w-[180px]">
                      {statusData.mollie_id}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Status sprawy:</span>
                  <span className="text-gray-600 dark:text-gray-400">{statusData.case_status}</span>
                </div>
                {statusData.payment_status && (
                  <div className="flex justify-between">
                    <span>Status płatności:</span>
                    <span className="text-gray-600 dark:text-gray-400">{statusData.payment_status}</span>
                  </div>
                )}
              </div>
            )}

            {/* Błąd fetchowania (przejściowy) */}
            {fetchError && uiStatus === 'loading' && (
              <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                {fetchError} · Ponawiam próbę…
              </p>
            )}

            {/* Polling indicator */}
            {uiStatus === 'loading' && pollCount > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Odpytywanie {pollCount}…</span>
              </div>
            )}
          </div>

          {/* Stopka z akcjami */}
          <div className="px-8 pb-8 flex flex-col gap-3">
            {/* Powrót do panelu */}
            <Link
              to="/client-dashboard"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              Przejdź do panelu
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Spróbuj ponownie – tylko przy błędzie */}
            {uiStatus === 'failed' && caseId && (
              <Link
                to={`/cases`}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Wróć do spraw
              </Link>
            )}
          </div>
        </div>

        {/* Badge bezpieczeństwa */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-600">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Płatności obsługiwane przez Mollie · SSL</span>
          <span className="mx-1">·</span>
          <Scale className="w-3.5 h-3.5" />
          <span>LexPortal Legal Tech</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
