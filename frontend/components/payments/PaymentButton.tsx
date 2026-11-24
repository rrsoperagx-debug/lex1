/**
 * PaymentButton – elegancki przycisk inicjujący płatność Mollie dla sprawy prawnej.
 *
 * Design: emerald-600 (zaufanie + bezpieczeństwo), zgodny z premium "Bank Millennium" stylem.
 *
 * Po kliknięciu:
 * 1. Wysyła POST /api/v1/payments/create/{caseId}
 * 2. Otrzymuje checkout_url z Mollie
 * 3. Przekierowuje użytkownika na stronę płatności Mollie
 *
 * Stany: idle → loading → (redirect) lub error
 */

import React, { useState } from 'react';
import { CreditCard, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { initiatePayment } from '../../services/payments';

interface PaymentButtonProps {
  /** UUID sprawy, za którą realizowana jest płatność */
  caseId: string;
  /** Kwota wyświetlana na przycisku, np. "199.00" */
  amount: string;
  /** Callback po wystąpieniu błędu */
  onError?: (message: string) => void;
  /** Dodatkowe klasy CSS dla kontenera */
  className?: string;
  /** Czy przycisk jest wyłączony z zewnątrz */
  disabled?: boolean;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  caseId,
  amount,
  onError,
  className = '',
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await initiatePayment(caseId);

      if (data.checkout_url) {
        // Przekierowanie do bramki płatności Mollie
        window.location.href = data.checkout_url;
      } else {
        throw new Error('Serwer nie zwrócił adresu płatności.');
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Nie udało się zainicjować płatności. Spróbuj ponownie.';

      setError(message);
      onError?.(message);
      console.error('Payment Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Biała karta premium */}
      <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-6">
        {/* Główny przycisk */}
        <button
          onClick={handlePayment}
          disabled={isLoading || disabled}
          aria-busy={isLoading}
          aria-label={isLoading ? 'Przetwarzanie płatności...' : `Opłać analizę – ${amount} PLN`}
          className={[
            'w-full flex items-center justify-center gap-3',
            'bg-emerald-600 hover:bg-emerald-700 text-white',
            'font-bold py-4 px-8 rounded-xl',
            'transition-all shadow-lg hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/30',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
            isLoading || disabled
              ? 'opacity-70 cursor-not-allowed'
              : 'active:scale-[0.98]',
          ].join(' ')}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          ) : (
            <CreditCard className="w-5 h-5 shrink-0" />
          )}
          <span>
            {isLoading
              ? 'Łączenie z bramką płatności…'
              : `Opłać analizę – ${amount} PLN`}
          </span>
        </button>

        {/* Badge bezpieczeństwa */}
        {!error && (
          <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-xs mt-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Bezpieczna płatność obsługiwana przez Mollie · SSL</span>
          </div>
        )}
      </div>

      {/* Komunikat błędu */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Błąd płatności</p>
            <p className="mt-0.5 opacity-90">{error}</p>
            <button
              onClick={handlePayment}
              className="mt-2 text-red-600 dark:text-red-300 underline underline-offset-2 hover:no-underline font-medium text-xs"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentButton;
