
/**
 * ============================================================================
 * LexPortal - Serwis API: Moduł Marketingu
 * ============================================================================
 *
 * Opis:
 * Ten plik stanowi warstwę serwisową (service layer) dla modułu marketingu.
 * Hermetyzuje on całą logikę komunikacji z endpointami API backendu,
 * które są związane z kampaniami marketingowymi. Komponenty React nie
 * odwołują się bezpośrednio do `fetch`, lecz korzystają z metod udostępnianych
 * przez ten obiekt.
 *
 * Kluczowe metody:
 * - `generatePlan`: Wysyła zapytanie do backendu w celu wygenerowania
 *   strategii marketingowej przez AI. Przyjmuje cel i kanał kampanii.
 *
 * - `createCampaign`: Wysyła dane nowej kampanii (wraz z planem AI)
 *   do backendu w celu zapisania ich w bazie danych.
 *
 * - `listCampaigns`: Pobiera listę wszystkich zapisanych kampanii
 *   marketingowych z serwera.
 *
 * Architektura:
 * - Wykorzystuje generyczną funkcję `apiCall` z `api.ts`, która obsługuje
 *   dodawanie nagłówków (np. autoryzacji), bazowego URL-a i obsługę błędów.
 * - Dzięki temu podejściu komponenty są odizolowane od szczegółów
 *   implementacyjnych API, a cała logika zapytań jest w jednym miejscu.
 * ============================================================================
 */
import { apiCall } from './api';

export interface CampaignCreate {
  name: string;
  channel: string;
  budget: number;
  goal: string;
  ai_generated_plan: any;
}

export const marketingApi = {
  generatePlan: (goal: string, channel: string) => 
    apiCall<any>(`/marketing/generate-plan?goal=${encodeURIComponent(goal)}&channel=${encodeURIComponent(channel)}`, {
      method: 'POST',
    }),
  
  createCampaign: (data: CampaignCreate) => 
    apiCall<any>('/marketing/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  listCampaigns: () => 
    apiCall<any[]>('/marketing/'),
};
