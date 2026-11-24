# ============================================================================
# LexPortal - Serwis Generatora Dokumentów PDF
# ============================================================================
#
# Opis:
#   Ten serwis odpowiada za generowanie dokumentów PDF na podstawie
#   szablonów HTML (Jinja2) i danych w formacie JSON.
#
# Proces generowania:
#   1. Wczytanie szablonu HTML z systemu plików.
#   2. Wypełnienie szablonu danymi (kontekstem) przy użyciu silnika Jinja2.
#   3. Konwersja wyrenderowanego kodu HTML do formatu PDF za pomocą
#      biblioteki WeasyPrint.
#
# Zależności:
#   - Jinja2: Do renderowania szablonów.
#   - WeasyPrint: Do konwersji HTML -> PDF.
#
# ============================================================================

import os
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from typing import Dict, Any

class DocumentGenerator:
    """
    Klasa enkapsulująca logikę generowania dokumentów PDF.
    """
    def __init__(self, templates_dir: str):
        """
        Inicjalizuje generator, ustawiając ścieżkę do katalogu z szablonami.

        Args:
            templates_dir (str): Ścieżka do katalogu, gdzie znajdują się
                                 szablony HTML (np. 'app/templates/documents').
        """
        if not os.path.isdir(templates_dir):
            raise FileNotFoundError(f"Katalog z szablonami nie istnieje: {templates_dir}")
        
        # Konfiguracja środowiska Jinja2 do wczytywania szablonów z podanego katalogu
        self.jinja_env = Environment(
            loader=FileSystemLoader(templates_dir),
            autoescape=True
        )

    def generate_pdf(self, template_name: str, context: Dict[str, Any]) -> bytes:
        """
        Generuje dokument PDF na podstawie szablonu i danych kontekstowych.

        Args:
            template_name (str): Nazwa pliku szablonu HTML (np. 'offer.html').
            context (Dict[str, Any]): Słownik z danymi do wypełnienia szablonu.

        Returns:
            bytes: Wygenerowany dokument PDF w formie binarnej.
        """
        try:
            # Wczytanie szablonu Jinja2
            template = self.jinja_env.get_template(template_name)
            
            # Renderowanie szablonu HTML z podanymi danymi
            rendered_html = template.render(context)
            
            # Konwersja HTML do PDF za pomocą WeasyPrint
            # `base_url` jest ważny do rozwiązywania ścieżek do zasobów (np. CSS, obrazki)
            pdf_bytes = HTML(string=rendered_html, base_url=".").write_pdf()
            
            return pdf_bytes
        
        except Exception as e:
            # W przypadku błędu (np. brak szablonu, błąd renderowania)
            # logujemy błąd i rzucamy wyjątek dalej.
            print(f"Błąd podczas generowania PDF dla szablonu '{template_name}': {e}")
            raise

# Przykład użycia (do testów)
if __name__ == '__main__':
    # Definicja ścieżki do szablonów
    # Zakładamy, że skrypt jest uruchamiany z głównego katalogu projektu
    templates_path = os.path.join("app", "templates", "documents")
    
    # Utworzenie instancji generatora
    generator = DocumentGenerator(templates_dir=templates_path)
    
    # Przykładowe dane kontekstowe dla oferty
    offer_context = {
        "company": {
            "name": "LexPortal Sp. z o.o.",
            "address": "ul. Wirtualna 1, 00-001 Warszawa",
            "nip": "123-456-78-90"
        },
        "client": {
            "name": "Jan Kowalski Consulting",
            "address": "ul. Prawdziwa 2, 02-200 Kraków"
        },
        "offer": {
            "number": "2026/02/A1",
            "date": "20.02.2026",
            "valid_until": "20.03.2026",
            "items": [
                {"name": "Analiza umowy najmu", "quantity": 1, "unit_price": "500.00", "net_value": "500.00"},
                {"name": "Konsultacja prawna online", "quantity": 2, "unit_price": "250.00", "net_value": "500.00"}
            ],
            "total_net": "1000.00",
            "vat_rate": 23,
            "vat_amount": "230.00",
            "total_gross": "1230.00"
        }
    }
    
    # Generowanie PDF
    pdf_output = generator.generate_pdf("offer.html", offer_context)
    
    # Zapisanie wygenerowanego PDF do pliku w celach testowych
    with open("test_offer.pdf", "wb") as f:
        f.write(pdf_output)
        
    print("Testowy plik 'test_offer.pdf' został pomyślnie wygenerowany.")
