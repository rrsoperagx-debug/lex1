/**
 * API klient dla modułu płatności LexPortal / Mollie.
 *
 * Endpointy:
 *  POST /api/v1/payments/create/{caseId}  → inicjuje płatność, zwraca checkout_url
 *  GET  /api/v1/payments/status/{caseId}  → polling statusu płatności i sprawy
 */

import { apiCall, ApiError } from './api';

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

export type PaymentStatus =
  | 'open'
  | 'canceled'
  | 'pending'
  | 'expired'
  | 'failed'
  | 'paid';

/** Odpowiedź z POST /payments/create/{caseId} */
export interface PaymentInitData {
  id: string;
  case_id: string;
  mollie_id: string;
  checkout_url: string;
  status: PaymentStatus;
  amount: string;
  currency: string;
}

/** Odpowiedź z GET /payments/status/{caseId} */
export interface PaymentStatusData {
  case_id: string;
  case_status: string;
  payment_status: PaymentStatus | null;
  mollie_id: string | null;
  /** true gdy sprawa ma status "Opłacona/W analizie" */
  is_paid: boolean;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Standalone export dla zgodności ze wzorcem z feedbacku.
 * Inicjuje płatność Mollie – alias dla paymentsApi.create.
 * Używany przez PaymentButton.tsx.
 */
export const initiatePayment = async (caseId: string): Promise<PaymentInitData> => {
  return paymentsApi.create(caseId);
};

export const paymentsApi = {
  /**
   * Inicjuje płatność Mollie dla danej sprawy.
   * Zwraca checkout_url, pod który należy przekierować użytkownika.
   *
   * @throws {ApiError} gdy backend zwróci błąd (403, 404, 409, 502, 503)
   */
  create: async (caseId: string): Promise<PaymentInitData> => {
    try {
      return await apiCall<PaymentInitData>(`/payments/create/${caseId}`, {
        method: 'POST',
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Nie udało się zainicjować płatności. Spróbuj ponownie.');
    }
  },

  /**
   * Odpytuje backend o aktualny status płatności i sprawy.
   * Używane do pollingu na stronie /payment/status po powrocie z Mollie.
   *
   * @throws {ApiError} gdy backend zwróci błąd
   */
  getStatus: async (caseId: string): Promise<PaymentStatusData> => {
    try {
      return await apiCall<PaymentStatusData>(`/payments/status/${caseId}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Nie udało się pobrać statusu płatności.');
    }
  },
};
