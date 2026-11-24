# =============================================================================
# Konwerter Obrazów do formatu WebP
# =============================================================================
#
# Prosty skrypt pomocniczy do konwersji obrazu z formatu źródłowego
# (np. PNG) na nowoczesny i zoptymalizowany format WebP.
#
# UWAGA:
#   Ścieżki do plików źródłowego i docelowego są wpisane na stałe.
#   W docelowym rozwiązaniu warto przekazywać je jako argumenty
#   linii poleceń (np. przy użyciu biblioteki `argparse`), aby
#   uczynić skrypt bardziej uniwersalnym.
#
# Przykład użycia biblioteki Pillow do operacji na obrazach.
#
# =============================================================================

from PIL import Image
import os

# --- KONFIGURACJA ---
# TODO: Zastąpić stałe ścieżki argumentami linii poleceń.
source_path = "/home/rr/Documents/Antigravity/GoogleAIstudio/Nowy katalog/16.02.2026_Docker_from_railway-main/frontend/assets/AI_Studio_law.png"
dest_path = "/home/rr/Documents/Antigravity/GoogleAIstudio/Nowy katalog/16.02.2026_Docker_from_railway-main/frontend/assets/AI_Studio_law.webp"
# --- KONIEC KONFIGURACJI ---

try:
    if os.path.exists(source_path):
        print(f"Otwieranie pliku: {source_path}...")
        img = Image.open(source_path)

        print(f"Zapisywanie do: {dest_path}...")
        # Konwersja i zapis z jakością 80% (dobry kompromis między rozmiarem a jakością)
        img.save(dest_path, "WEBP", quality=80)

        print("Konwersja zakończona sukcesem!")
    else:
        print(f"Błąd: Plik źródłowy nie został znaleziony w {source_path}")

except Exception as e:
    print(f"Wystąpił błąd: {e}")
