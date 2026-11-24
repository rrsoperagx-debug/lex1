export interface FAQItem {
  q: string;
  a: string;
}

export interface FAQCategory {
  title: string;
  items: FAQItem[];
}

export const faqCategories: FAQCategory[] = [
  {
    title: "Konto i Bezpieczeństwo Danych",
    items: [
      {
        q: "W jaki sposób chronione są moje dane osobowe i tajemnica prawnicza?",
        a: "Bezpieczeństwo Państwa danych oraz ochrona tajemnicy adwokackiej i radcowskiej są fundamentem naszej działalności. Panel Klienta wykorzystuje zaawansowane standardy szyfrowania danych SSL/TLS z 256-bitowym kluczem, co jest standardem w instytucjach finansowych. Całość komunikacji oraz przesyłane dokumenty są chronione przed dostępem osób trzecich. Serwery znajdują się w certyfikowanych centrach danych na terenie UE, co gwarantuje pełną zgodność z RODO oraz wytycznymi organów nadzorczych dotyczących przechowywania dokumentacji prawnej."
      },
      {
        q: "Co zrobić, jeśli podejrzewam, że ktoś nieuprawniony uzyskał dostęp do mojego konta?",
        a: "W sytuacji podejrzenia naruszenia bezpieczeństwa konta, należy niezwłocznie podjąć dwa kroki. Po pierwsze, prosimy o natychmiastową zmianę hasła w sekcji „Ustawienia Profilu” na silne, unikalne hasło (minimum 12 znaków, w tym znaki specjalne). Po drugie, należy powiadomić naszego Administratora Bezpieczeństwa Informacji drogą mailową lub telefoniczną. Nasz zespół IT dokona wówczas weryfikacji logów systemowych, wyloguje wszystkie aktywne sesje i, jeśli zajdzie taka potrzeba, czasowo zablokuje dostęp do konta do czasu pełnego wyjaśnienia incydentu."
      },
      {
        q: "Czy moje dane są przechowywane na serwerach wewnątrz Unii Europejskiej?",
        a: "Tak, absolutnie wszystkie Państwa dane, w tym wrażliwa dokumentacja procesowa oraz historia komunikacji, są przechowywane na serwerach zlokalizowanych wyłącznie na terenie Unii Europejskiej. Wybór lokalizacji serwerów podyktowany jest rygorystycznymi przepisami dotyczącymi ochrony prywatności i bezpieczeństwa danych osobowych. Dzięki temu mają Państwo pewność, że dane podlegają jurysdykcji europejskiej, która zapewnia najwyższy na świecie standard ochrony praw jednostki w sferze cyfrowej."
      },
      {
        q: "Jak mogę trwale i bezpiecznie usunąć swoje konto z Panelu Klienta?",
        a: "Proces usunięcia konta jest realizowany na pisemny wniosek klienta przesłany poprzez „Bezpieczny Czat” lub oficjalny Formularz Kontaktowy. Po otrzymaniu zgłoszenia, nasz zespół dokonuje weryfikacji tożsamości, aby zapobiec przypadkowemu usunięciu danych. Należy jednak pamiętać, że zgodnie z przepisami o archiwizacji dokumentacji prawnej oraz obowiązkami podatkowymi, niektóre dane (np. faktury czy kopie pism procesowych) mogą być przechowywane przez okres wymagany prawem, mimo zamknięcia dostępu do Panelu."
      },
      {
        q: "Czym różni się hasło do Panelu od zabezpieczeń stosowanych w korespondencji e-mail?",
        a: "Hasło do Panelu Klienta jest kluczem do zaszyfrowanego środowiska, które jest znacznie bezpieczniejsze niż standardowa poczta e-mail. E-maile często krążą między serwerami w formie niezaszyfrowanej, co naraża je na przechwycenie. Komunikacja wewnątrz naszego Panelu odbywa się w zamkniętym, certyfikowanym ekosystemie. Zalecamy stosowanie haseł unikatowych, których nie używają Państwo w innych serwisach, co w połączeniu z naszymi systemami ochrony stanowi barierę niemal nie do przebicia dla cyberprzestępców."
      },
      {
        q: "Czy system rejestruje historię moich logowań i aktywności?",
        a: "Tak, system prowadzi zaawansowany audyt aktywności (Audit Log) dla zapewnienia najwyższego poziomu bezpieczeństwa. Rejestrujemy daty logowań, adresy IP oraz kluczowe operacje na dokumentach. Dane te są dostępne wyłącznie dla administratorów bezpieczeństwa i służą do monitorowania, czy na koncie nie dochodzi do nietypowych działań. W przypadku wykrycia logowania z nowej lokalizacji lub urządzenia, system może automatycznie poprosić o dodatkową weryfikację tożsamości."
      },
      {
        q: "Jak skonfigurować silne hasło, które będzie akceptowane przez system?",
        a: "Nasze standardy bezpieczeństwa wymagają, aby hasło składało się z co najmniej 10-12 znaków. Musi ono zawierać kombinację wielkich i małych liter, cyfr oraz co najmniej jednego znaku specjalnego (np. !, @, #). System posiada wbudowany analizator siły hasła, który nie pozwoli na ustawienie zbyt prostych fraz, takich jak daty urodzenia czy popularne słowa. Rekomendujemy korzystanie z managerów haseł, które generują i przechowują bezpieczne, losowe ciągi znaków."
      },
      {
        q: "W jaki sposób weryfikowana jest tożsamość prawnika po drugiej stronie czatu?",
        a: "Dostęp do Panelu Operatora mają wyłącznie zweryfikowani pracownicy naszej kancelarii, posiadający odpowiednie uprawnienia zawodowe. Każdy prawnik loguje się za pomocą imiennego konta z wieloskładnikowym uwierzytelnianiem. Dzięki temu mają Państwo absolutną pewność, że porady udzielane przez system pochodzą od specjalistów przypisanych do Państwa sprawy. Tożsamość operatora jest zawsze widoczna w nagłówku rozmowy wraz z jego stopniem zawodowym (np. adwokat, radca prawny)."
      },
      {
        q: "Czy mogę udostępnić dane do logowania członkom mojej rodziny lub wspólnikom?",
        a: "Zdecydowanie odradzamy udostępnianie danych logowania osobom trzecim, nawet najbliższym. Każdy dostęp powinien być indywidualny ze względów bezpieczeństwa prawnego i odpowiedzialności za dokumentację. Jeśli zachodzi potrzeba, aby inna osoba miała dostęp do sprawy, prosimy o kontakt – możemy utworzyć subkonto z odpowiednio ograniczonymi uprawnieniami lub dodać kolejnego użytkownika do danej sprawy, co pozwoli na bezpieczny i kontrolowany wgląd w postępy prac."
      },
      {
        q: "Co dzieje się z moimi danymi po zakończeniu współpracy z Kancelarią?",
        a: "Po zakończeniu współpracy Państwa konto w Panelu może pozostać aktywne jako archiwum dokumentacji przez określony czas, lub zostać zlikwidowane na Państwa prośbę. Dokumenty papierowe i ich cyfrowe odpowiedniki są przechowywane zgodnie z ustawowymi terminami przedawnienia roszczeń i obowiązkami archiwizacyjnymi nałożonymi na prawników. Po upływie tych terminów, dane are trwale i nieodwracalnie usuwane przy użyciu profesjonalnych metod niszczenia danych cyfrowych."
      }
    ]
  },
  {
    title: "Terminarz i Konsultacje",
    items: [
      {
        q: "Jak poprawnie zarezerwować termin konsultacji poprzez system?",
        a: "Proces rezerwacji w naszym Terminarzu jest intuicyjny, lecz wymaga uwagi. Po przejściu do sekcji „Terminarz”, należy wybrać preferowany widok kalendarza (np. tygodniowy), a następnie kliknąć w wolne pole (slot) oznaczające dostępność prawnika. W formularzu, który się pojawi, prosimy o zwięzłe opisanie materii prawnej, której dotyczyć ma spotkanie. Pozwoli to naszemu specjaliście na wstępną analizę Państwa sytuacji jeszcze przed spotkaniem, co znacząco podnosi efektywność samej konsultacji. Po zatwierdzeniu, otrzymają Państwo e-mail z potwierdzeniem rezerwacji."
      },
      {
        q: "Dlaczego po dodaniu nowego terminu nie pojawia się on natychmiast w moim kalendarzu?",
        a: "Zazwyczaj termin powinien pojawić się natychmiastowo dzięki synchronizacji w czasie rzeczywistym. Jeśli jednak tak się nie stanie, prosimy o odświeżenie strony (klawisz F5 lub przycisk odśwież w przeglądarce). Przyczyną opóźnienia może być chwilowe obciążenie łącza internetowego lub konieczność wstępnej weryfikacji terminu przez system (np. sprawdzanie konfliktów z innymi rezerwacjami). Jeśli po minucie termin nadal nie jest widoczny, prosimy o kontakt z działem wsparcia, gdyż może to oznaczać błąd w zapisie danych w bazie."
      },
      {
        q: "Czy mogę przesunąć termin spotkania na inną godzinę bez jego usuwania?",
        a: "Tak, system umożliwia edycję terminów. Należy kliknąć w umówioną konsultację w kalendarzu, a następnie wybrać opcję „Edytuj”. Można wtedy wybrać nową godzinę lub datę spośród aktualnie dostępnych wolnych terminów. Prosimy o dokonywanie takich zmian z wyprzedzeniem co najmniej 24-godzinnym. Pozwala to na reorganizację planu dnia prawnika i sprawne zarządzanie czasem kancelarii. Każda zmiana terminu powoduje wysłanie automatycznego powiadomienia do prawnika oraz zaktualizowanie zapisu w obu panelach."
      },
      {
        q: "Jakie są dostępne formy konsultacji i jak wybrać tę właściwą?",
        a: "W formularzu rezerwacji mogą Państwo wybrać spośród trzech form: konsultacja stacjonarna w siedzibie kancelarii, telekonferencja oraz spotkanie wideo online. Wybór zależy od Państwa preferencji oraz charakteru sprawy. Sprawy wymagające analizy dużej ilości dokumentów papierowych sugerujemy omawiać stacjonarnie, natomiast szybkie porady prawne lub statusy spraw doskonale sprawdzają się w formie wideo. Po wyborze formy online, w szczegółach spotkania pojawi się bezpieczny link do pokoju konferencyjnego."
      },
      {
        q: "Czy otrzymajam przypomnienie o nadchodzącym spotkaniu i w jakiej formie?",
        a: "Tak, nasz system dba o to, aby nie pominęli Państwo żadnego ważnego spotkania. Wysyłamy automatyczne powiadomienia e-mail w dwóch turach: pierwsze na 24 godziny przed planowanym terminem, a drugie na jedną godzinę przed rozpoczęciem konsultacji. Przypomnienie zawiera datę, godzinę, nazwisko prawnika oraz link do spotkania (jeśli jest to forma online). Dodatkowo, w Panelu Klienta na pulpicie głównym pojawi się licznik czasu odliczający do najbliższego wydarzenia z Terminarza."
      },
      {
        q: "Czy mój prawnik widzi ten sam kalendarz co ja w swoim panelu?",
        a: "Tak, Panel Klienta i Panel Operatora są ze sobą w pełni zsynchronizowane. Prawnik widzi Państwa rezerwację w swoim profesjonalnym kalendarzu wraz ze wszystkimi załączonymi informacjami. Dzięki temu ma on pełną kontrolę nad swoim harmonogramem i może odpowiednio przygotować się do rozmowy z Państwem. Wszelkie notatki, które prawnik doda do terminu (np. sygnatura akt czy lista dokumentów do przygotowania), mogą zostać udostępnione do Państwa wglądu, jeśli uzna to za pomocne."
      },
      {
        q: "Co zrobić, jeśli w kalendarzu nie ma dostępnych wolnych terminów u mojego prawnika?",
        a: "W sytuacjach dużej intensywności prac procesowych, kalendarze prawników mogą być wypełnione z wyprzedzeniem. W takim przypadku zachęcamy do skorzystania z „Bezpiecznego Czatu” i opisania pilności sprawy. Często jesteśmy w stanie wygospodarować dodatkowy czas na krótką konsultację lub przypisać do Państwa sprawy innego, równie kompetentnego specjalistę z danego działu prawa. Można również zapisać się na listę oczekujących – system powiadomi Państwa, jeśli inny klient zwolni dany termin."
      },
      {
        q: "Jak przygotować się merytorycznie do umówionej konsultacji prawnej?",
        a: "Efektywna konsultacja to taka, podczas której prawnik dysponuje kompletem informacji. Zalecamy, aby przed spotkaniem przesłać kluczowe dokumenty za pośrednictwem „Bezpiecznego Czatu” oraz przygotować listę konkretnych pytań, na które chcą Państwo uzyskać odpowiedź. W opisie terminu warto wskazać najważniejsze fakty chronologicznie. Dzięki temu prawnik zamiast tracić czas na zapoznawanie się z faktami podczas spotkania, będzie mógł od razu przejść do analizy prawnej i zaproponowania konkretnych rozwiązań."
      },
      {
        q: "Czy mogę umówić cykl regularnych spotkań, jeśli moja sprawa jest wielowątkowa?",
        a: "Tak, nasz system wspiera rezerwacje cykliczne dla spraw wymagających stałego nadzoru. Jeśli prowadzą Państwo z nami skomplikowany proces inwestycyjny lub restrukturyzacyjny, operator może ustawić w Terminarzu stałe pory konsultacji (np. każdy wtorek o 10:00). Dzięki temu mają Państwo gwarancję dostępności swojego prawnika i mogą lepiej planować działania operacyjne w swojej firmie lub życiu prywatnym, wiedząc, że wsparcie prawne jest zapewnione w stałym harmonogramie."
      },
      {
        q: "Gdzie znajdę historię moich minionych konsultacji i ich podsumowania?",
        a: "Wszystkie zrealizowane terminy są przenoszone do sekcji „Archiwum Terminarza”. Po zakończeniu konsultacji, prawnik często zamieszcza tam krótkie podsumowanie ustaleń lub listę zadań do wykonania (tzw. Follow-up). Mogą Państwo w dowolnym momencie wrócić do tych zapisów, aby sprawdzić, co zostało ustalone podczas spotkania sprzed miesiąca czy roku. Archiwum jest w pełni przeszukiwalne po dacie, nazwisku prawnika lub temacie rozmowy, co stanowi nieocenioną pomoc w długotrwałych procesach."
      }
    ]
  },
  {
    title: "Bezpieczny Czat i Komunikacja",
    items: [
      {
        q: "Do czego służy „Bezpieczny Czat” i kiedy najlepiej z niego korzystać?",
        a: "Bezpieczny Czat to profesjonalny komunikator wbudowany w nasz system, zaprojektowany jako bezpieczna alternatywa dla e-maila i telefonu. Należy z niego korzystać przy każdej wymianie informacji dotyczącej Państwa sprawy, zwłaszcza gdy przesyłają Państwo dane wrażliwe, skany dokumentów czy pytania wymagające wiążącej odpowiedzi prawnej. Czat zapewnia ciągłość korespondencji – cała historia rozmowy z prawnikiem jest w jednym miejscu, co eliminuje ryzyko zagubienia ważnych informacji w gąszczu innej poczty."
      },
      {
        q: "Jak mogę wyeksportować historię rozmowy z czatu do pliku PDF lub TXT?",
        a: "Zapewniamy pełną transparentność komunikacji, dlatego w oknie czatu znajduje się funkcja „Eksportuj rozmowę”. Po jej wybraniu mogą Państwo pobrać całą historię konwersacji w formacie PDF, który zachowuje profesjonalny układ, daty, godziny oraz nazwisko rozmówcy – jest to idealne rozwiązanie do archiwizacji dokumentacji w formacie papierowym. Dostępny jest również format TXT dla łatwego kopiowania treści. Eksport obejmuje wszystkie wiadomości tekstowe oraz listę przesłanych załączników wraz z ich nazwami."
      },
      {
        q: "Dlaczego mój prawnik nie odpowiada natychmiast na wiadomości w czacie?",
        a: "Nasi prawnicy starają się odpowiadać na zapytania tak szybko, jak pozwala na to ich harmonogram, zazwyczaj w ciągu kilku godzin roboczych. Należy jednak pamiętać, że specyfika zawodu prawnika wiąże się z częstymi wizytami w sądach, prokuraturach czy urzędach, gdzie dostęp do systemów elektronicznych jest ograniczony. Każda wiadomość na czacie jest kolejkowana i prawnik otrzyma o niej powiadomienie zaraz po powrocie do stanowiska pracy. W sprawach wymagających natychmiastowej interwencji, prosimy o kontakt telefoniczny z sekretariatem."
      },
      {
        q: "Czy wiadomości przesyłane na czacie mają moc dowodową?",
        a: "Tak, komunikacja prowadzona poprzez nasz autoryzowany system jest traktowana jako oficjalna korespondencja między klientem a kancelarią. Każda wiadomość posiada precyzyjny znacznik czasowy (timestamp) oraz jest podpisana certyfikowanym loginem użytkownika. W przypadku sporów dotyczących ustaleń czy terminów, historia czatu stanowi wiarygodny dowód na to, jakie informacje i kiedy zostały przekazane. Dzięki szyfrowaniu i brakowi możliwości edycji wiadomości po ich wysłaniu, integralność tych danych jest niepodważalna."
      },
      {
        q: "Jak sprawdzić, czy moja wiadomość została odczytana przez prawnika?",
        a: "System komunikacji wyposażony jest w statusy doręczenia i odczytu, podobnie jak popularne komunikatory mobilne. Pojedynczy znacznik (ptaszek) przy wiadomości oznacza, że została ona poprawnie wysłana i zapisana na naszym zabezpieczonym serwerze. Zmiana koloru znacznika lub pojawienie się podwójnej ikony informuje, że operator wyświetlił okno rozmowy i zapoznał się z treścią wiadomości. Dzięki temu mają Państwo pewność, że informacja dotarła do adresata i jest w trakcie analizy."
      },
      {
        q: "Czy mogę przesyłać na czacie zdjęcia (JPG/PNG) oraz dokumenty tekstowe?",
        a: "Tak, nasz czat wspiera wielokanałową wymianę plików. Mogą Państwo przesyłać zdjęcia dowodów, skany pism procesowych (JPG, PNG), a także dokumenty w formatach DOC, PDF, TXT oraz arkusze CSV. Aby to zrobić, wystarczy kliknąć ikonę spinacza i wybrać plik z urządzenia. Każdy załącznik jest automatycznie skanowany przez system antywirusowy przed udostępnieniem go prawnikowi, co zapewnia obustronne bezpieczeństwo cyfrowe. Przesłane pliki są również widoczne w zbiorczej sekcji „Dokumenty”."
      },
      {
        q: "Czy czat działa poprawnie na urządzeniach mobilnych (smartfon, tablet)?",
        a: "Nasz system został stworzony w technologii responsywnej, co oznacza, że interfejs czatu dostosowuje się do wielkości ekranu każdego nowoczesnego urządzenia. Mogą Państwo bez przeszkód pisać do prawnika i przesyłać zdjęcia dokumentów prosto z aparatu w smartfonie, będąc w sądzie lub w podróży. Wszystkie funkcjonalności, w tym eksport rozmów i podgląd załączników, są dostępne w wersji mobilnej, co pozwala na stały kontakt z kancelarią bez względu na miejsce pobytu."
      },
      {
        q: "Jak zachować profesjonalizm i klarowność komunikacji na czacie?",
        a: "Chociaż czat sprzyja szybkiej wymianie myśli, zachęcamy do formułowania pytań w sposób precyzyjny i rzeczowy. Warto każdą nową kwestię prawną zaczynać od krótkiego tytułu lub numeru sprawy, jeśli prowadzą Państwo z nami kilka procesów jednocześnie. Klarowna komunikacja skraca czas potrzebny prawnikowi na udzielenie odpowiedzi i minimalizuje ryzyko nieporozumień. Prosimy również o unikanie przesyłania bardzo dużej liczby pojedynczych wiadomości – lepiej sformułować jedno zbiorcze zapytanie."
      },
      {
        q: "Co zrobić, jeśli przypadkowo wysłałem błędną informację na czacie?",
        a: "Zgodnie z zasadami bezpieczeństwa i nienaruszalności dokumentacji, wysłanych wiadomości nie można usuwać ani edytować. Jeśli zauważą Państwo błąd w swojej wiadomości, prosimy o niezwłoczne wysłanie kolejnej wiadomości z korektą (sprostowaniem). Prawnik biorąc pod uwagę historię rozmowy, uwzględni najnowszą wersję informacji. Takie podejście gwarantuje, że historia komunikacji jest prawdziwym odzwierciedleniem procesu doradczego i chroni obie strony przed zarzutami o manipulację treścią rozmów."
      },
      {
        q: "Czy historia czatu jest archiwizowana po zakończeniu danej sprawy?",
        a: "Tak, po merytorycznym zakończeniu sprawy cała historia rozmowy zostaje przeniesiona do „Archiwum Rozmów”. Nie jest ona usuwana, lecz ukrywana z widoku bieżącego, aby zachować porządek w panelu. W każdej chwili mogą Państwo do niej wrócić, odszukać ważne ustalenia lub ponownie wyeksportować historię do pliku. Archiwizacja ta trwa tak długo, jak długo posiadają Państwo aktywne konto w naszym systemie, co zapewnia Państwu wieczysty wgląd w historię udzielonej pomocy prawnej."
      }
    ]
  },
  {
    title: "Obsługa Plików i Dokumentów",
    items: [
      {
        q: "Jakie formaty plików są obsługiwane przez system i dlaczego te konkretne?",
        a: "Nasz system obsługuje najbardziej powszechne i bezpieczne formaty: .PDF (powszechny standard pism procesowych), .DOC/.DOCX (dokumenty edytowalne), .JPG/.PNG (zdjęcia i skany), .TXT (proste notatki) oraz .CSV (dane tabelaryczne). Wybór tych formatów podyktowany jest koniecznością zachowania kompatybilności z systemami sądowymi (Portal Informacyjny Sądów) oraz zapewnieniem, że dokumenty nie będą zawierać ukrytego złośliwego kodu. Pliki o innych rozszerzeniach (np. .exe, .zip) są blokowane ze względów bezpieczeństwa IT."
      },
      {
        q: "Dlaczego przycisk dodawania plików czasem nie reaguje na kliknięcie?",
        a: "Brak reakcji przycisku może wynikać z kilku przyczyn technicznych: zbyt duży rozmiar pliku (limit to zazwyczaj 25MB), niestabilne połączenie internetowe lub przeciążenie pamięci podręcznej przeglądarki. W pierwszej kolejności prosimy spróbować odświeżyć stronę. Jeśli problem nadal występuje, należy upewnić się, czy przeglądarka posiada uprawnienia do dostępu do plików na Państwa urządzeniu. W rzadkich przypadkach przyczyną może być oprogramowanie antywirusowe na komputerze klienta, które blokuje skrypty przesyłania danych – warto wtedy spróbować innej przeglądarki (zalecamy Chrome lub Firefox)."
      },
      {
        q: "Gdzie dokładnie znajdę pliki, które prawnik przesłał do mnie w mojej sprawie?",
        a: "Wszystkie pliki otrzymane od Kancelarii znajdują się w dwóch miejscach. Po pierwsze, są one widoczne bezpośrednio w wątku rozmowy w sekcji „Bezpieczny Czat”. Po drugie, dla Państwa wygody, system automatycznie kataloguje wszystkie załączniki w sekcji „Repozytorium Dokumentów”. Można tam filtrować pliki według daty otrzymania, rodzaju (np. tylko PDF) lub osoby wysyłającej. Dzięki temu nie muszą Państwo przeszukiwać całej historii rozmów, aby odnaleźć jeden konkretny dokument, np. projekt umowy czy opinię prawną."
      },
      {
        q: "Czy przesyłane przeze mnie dokumenty są bezpieczne i wolne od wirusów?",
        a: "Bezpieczeństwo cyfrowe jest dla nas priorytetem. Każdy plik przesyłany przez klienta do systemu przechodzi automatyczne skanowanie wielosilnikowym programem antywirusowym w chmurze jeszcze przed zapisaniem go na naszym serwerze. Chroni to infrastrukturę kancelarii oraz urządzenia naszych prawników przed zainfekowaniem. Analogicznie, każdy dokument wysyłany od nas do Państwa jest weryfikowany, co daje Państwu gwarancję, że pobieranie plików z naszego panelu jest całkowicie bezpieczne i nie zagraża Państwa komputerom."
      },
      {
        q: "Jak długo moje dokumenty będą przechowywane i dostępne w Panelu Klienta?",
        a: "Dokumenty są przechowywane przez cały okres trwania aktywnej współpracy oraz przez co najmniej 5 lat po jej zakończeniu (zgodnie z przepisami o archiwizacji akt adwokackich i radcowskich). Przez cały ten czas mają Państwo do nich nieograniczony dostęp 24/7. W przypadku decyzji o całkowitym usunięciu konta, zalecamy wcześniejsze pobranie wszystkich kluczowych plików na własny dysk, ponieważ po usunięciu konta dostęp do repozytorium zostanie bezpowrotnie zamknięty w celu ochrony Państwa prywatności."
      },
      {
        q: "Czy mogę przesyłać nagrania audio lub wideo jako dowody w sprawie?",
        a: "Ze względu na duże rozmiary plików multimedialnych oraz specyficzne wymogi bezpieczeństwa, przesyłanie formatów wideo i audio (np. .mp4, .mp3) jest domyślnie wyłączone w standardowym oknie czatu. Jeśli posiadają Państwo dowody w tej formie, prosimy o poinformowanie o tym prawnika. Udostępnimy wtedy Państwu specjalny, jednorazowy i zabezpieczony link do dedykowanego serwera plików o dużej pojemności, gdzie będzie można bezpiecznie wgrać większe materiały dowodowe do analizy."
      },
      {
        q: "Jak poprawnie skanować dokumenty papierowe, aby były czytelne dla prawnika?",
        a: "Jakość dostarczonych dokumentów ma wpływ na szybkość naszej pracy. Zalecamy skanowanie w kolorze lub skali szarości, w rozdzielczości 300 DPI, do formatu PDF. Jeśli korzystają Państwo z aparatu w telefonie, prosimy o zadbanie o dobre oświetlenie i ułożenie dokumentu na płaskiej powierzchni. Istnieje wiele darmowych aplikacji typu „Scanner”, które automatycznie korygują perspektywę i poprawiają kontrast tekstu. Dokumenty nieczytelne, rozmazane lub ucięte mogą wymagać ponownego przesłania, co niepotrzebnie wydłuża procedury."
      },
      {
        q: "Czy system pozwala na wersjonowanie dokumentów (np. kilka wersji umowy)?",
        a: "Tak, repozytorium dokumentów obsługuje logiczne wersjonowanie. Jeśli przesyłają Państwo poprawioną wersję dokumentu o tej samej nazwie, system zapyta, czy zastąpić istniejący plik, czy zapisać go jako nową wersję (np. v2). Rekomendujemy zachowywanie wszystkich wersji projektów umów, ponieważ historia zmian często jest kluczowa dla zrozumienia intencji stron podczas negocjacji. Każda wersja jest opatrzona datą dodania, co pozwala na łatwe śledzenie postępów w pracy nad danym pismem."
      },
      {
        q: "Kto poza moim prawnikiem ma wgląd w przesyłane przeze mnie pliki?",
        a: "Dostęp do dokumentacji jest ściśle reglamentowany i oparty na zasadzie „need-to-know” (wiedza niezbędna). Poza prawnikiem prowadzącym sprawę, wgląd w pliki może mieć wyznaczony asystent prawny (pomagający w przygotowaniu pism) oraz administrator systemu (tylko w celach technicznych). Wszystkie te osoby are związane ustawową tajemnicą zawodową lub surowymi klauzulami poufności. System rejestruje każde otwarcie pliku, więc dokładnie wiemy, kto i kiedy zapoznawał się z danym dokumentem, co zapewnia pełną kontrolę nad obiegiem informacji."
      },
      {
        q: "Jak mogę pobrać wszystkie dokumenty naraz (eksport masowy)?",
        a: "Jeśli potrzebują Państwo pobrać całą zgromadzoną dokumentację, np. na potrzeby innej instytucji lub do własnego archiwum, w sekcji „Repozytorium” dostępna jest funkcja „Pobierz wszystko”. System przygotuje wtedy zaszyfrowaną paczkę ZIP zawierającą wszystkie pliki posegregowane w folderach według dat lub kategorii. Przygotowanie takiej paczki może zająć kilka minut w przypadku bardzo dużej liczby dokumentów. Link do pobrania gotowego archiwum zostanie wysłany na Państwa e-mail ze względów bezpieczeństwa."
      }
    ]
  },
  {
    title: "Poczta i Wiadomości Systemowe",
    items: [
      {
        q: "Dlaczego niektóre tematy wiadomości w sekcji Poczta są pogrubione?",
        a: "Pogrubienie tematu wiadomości (czcionka Bold) jest graficznym wskaźnikiem statusu „Nieprzeczytana”. Ma to na celu natychmiastowe zwrócenie Państwa uwagi na nową korespondencję od kancelarii, która wymaga zapoznania się. System automatycznie wykrywa fakt otwarcia wiadomości i zmienia formatowanie tematu na standardowe (Regular). Jest to proste, ale bardzo skuteczne narzędzie do zarządzania priorytetami w komunikacji, pozwalające uniknąć przeoczenia ważnych informacji procesowych czy administracyjnych."
      },
      {
        q: "Czy „Poczta” w Panelu Klienta to to samo co mój prywatny e-mail?",
        a: "Nie, Poczta wewnątrz Panelu jest całkowicie niezależnym i zamkniętym systemem komunikacji wewnętrznej kancelarii. Wiadomości tutaj przesyłane nie trafiają na Państwa zewnętrzną skrzynkę (np. Gmail, Outlook), chyba że włączyli Państwo powiadomienia o nowej poczcie. To rozdzielenie służy bezpieczeństwu – oficjalna korespondencja prawna pozostaje wewnątrz chronionego systemu, co eliminuje ryzyko ataku typu phishing czy podszywania się pod kancelarię przez osoby trzecie."
      },
      {
        q: "Gdzie trafiają informacje wysłane przeze mnie przez Formularz Kontaktowy?",
        a: "Każde zapytanie wysłane przez Formularz Kontaktowy jest natychmiast zapisywane w naszej bazie danych i konwertowane na wewnętrzną wiadomość systemową. Trafia ona do sekcji „Poczta” w panelu operatora, gdzie jest przypisywana do odpowiedniego działu lub konkretnego prawnika prowadzącego Państwa sprawy. Dzięki temu mają Państwo gwarancję, że wiadomość nie zginie w spamie, a każda prośba o kontakt zostanie odnotowana w systemie z dokładną datą i godziną wpłynięcia, co jest istotne dla zachowania standardów obsługi."
      },
      {
        q: "Jakie rodzaje powiadomień systemowych mogę otrzymywać w sekcji Poczta?",
        a: "Sekcja Poczta służy do przesyłania trzech głównych rodzajów informacji: 1. Komunikaty merytoryczne od prawników (np. prośby o uzupełnienie faktów). 2. Powiadomienia systemowe (np. informacja o wystawionej fakturze, zmiana statusu sprawy). 3. Alerty bezpieczeństwa (np. informacja o logowaniu z nowego urządzenia). Dzięki takiemu podziałowi mają Państwo wgląd w całą „biografię” współpracy z kancelarią w jednym, chronologicznym widoku."
      },
      {
        q: "Czy mogę samodzielnie usuwać przeczytane wiadomości z mojej poczty?",
        a: "Ze względu na konieczność zachowania pełnej historii współpracy dla celów dowodowych i audytowych, funkcja trwałego usuwania wiadomości jest niedostępna. Mogą Państwo jednak skorzystać z opcji „Archiwizuj”. Przeniesie ona wiadomość z widoku głównego do folderu „Archiwum”, co pozwoli zachować porządek w skrzynce odbiorczej, jednocześnie nie tracąc dostępu do treści wiadomości w przyszłości. Uważamy, że w sprawach prawnych lepiej zachować historię rozmów, niż ryzykować utratę ważnego ustalenia."
      },
      {
        q: "Dlaczego po odczytaniu wiadomości na telefonie, na komputerze nadal jest ona pogrubiona?",
        a: "Synchronizacja statusu przeczytania odbywa się w czasie rzeczywistym, jednak czasem przeglądarka na komputerze może wyświetlać wersję strony zapisaną w pamięci podręcznej (cache). W takiej sytuacji wystarczy odświeżyć stronę lub kliknąć w dowolną inną zakładkę i wrócić do poczty. System na serwerze wie już, że wiadomość jest przeczytana, więc odświeżenie widoku przywróci spójność na wszystkich Państwa urządzeniach. Jest to standardowy mechanizm działania aplikacji webowych."
      },
      {
        q: "Czy mogę tworzyć własne foldery w sekcji Poczta do segregowania wiadomości?",
        a: "Obecnie system oferuje predefiniowany podział na: Odebrane, Wysłane, Archiwalne oraz Ważne (oznaczone gwiazdką). Jeśli prowadzą Państwo u nas wiele spraw jednocześnie, wiadomości są automatycznie kategoryzowane według sygnatury sprawy lub tematu, co zazwyczaj wystarcza do sprawnego zarządzania korespondencją. Rozważamy wprowadzenie funkcji tworzenia własnych folderów w przyszłych aktualizacjach panelu, aby jeszcze bardziej wyjść naprzeciw potrzebom naszych najbardziej aktywnych klientów."
      },
      {
        q: "Jak oznaczyć wiadomość jako „Ważną”, aby łatwo do niej wrócić?",
        a: "Przy każdej wiadomości na liście znajduje się ikona gwiazdki. Kliknięcie w nią powoduje oznaczenie wiadomości jako priorytetowej. Tak oznaczona korespondencja pojawia się w dedykowanej zakładce „Ważne”. Jest to niezwykle przydatne, gdy otrzymują Państwo od nas np. instrukcję dotyczącą zachowania w sądzie lub listę terminów płatności, do których muszą Państwo wielokrotnie zaglądać w trakcie trwania procesu."
      },
      {
        q: "Czy system informuje mnie, że prawnik przeczytał moją wiadomość wysłaną pocztą?",
        a: "W sekcji „Wiadomości Wysłane” przy każdej pozycji widoczna jest ikona statusu. Jeśli ikona jest szara, oznacza to, że wiadomość czeka w kolejce na odczytanie. Zmiana koloru ikony na niebieski lub zielony (w zależności od motywu) informuje, że prawnik otworzył wiadomość w swoim Panelu Operatora. Daje to Państwu pewność, że informacja została odebrana i jest procesowana przez nasz zespół."
      },
      {
        q: "Co zrobić, jeśli nie otrzymuję powiadomień e-mail o nowej poczcie w panelu?",
        a: "W pierwszej kolejności prosimy sprawdzić folder „Spam” lub „Oferty” w swojej zewnętrznej skrzynce e-mail oraz upewnić się, że adres no-reply@naszakancelaria.pl jest dodany do listy zaufanych nadawców. Następnie w „Ustawieniach Profilu” w Panelu Klienta należy zweryfikować, czy suwak powiadomień e-mail jest ustawiony w pozycji „Włączone”. Jeśli mimo to powiadomienia nie docierają, problem może leżeć po stronie filtrów bezpieczeństwa u Państwa dostawcy poczty (np. WP.pl, Onet, Gmail) – w takim przypadku prosimy o kontakt z naszym wsparciem technicznym."
      }
    ]
  },
  {
    title: "Płatności i Rozliczenia",
    items: [
      {
        q: "Gdzie dokładnie znajdę faktury za świadczone usługi prawne?",
        a: "Wszystkie faktury VAT, rachunki oraz noty księgowe są generowane automatycznie i udostępniane w sekcji „Finanse i Faktury” (dostępnej z menu głównego). Dodatkowo, po wystawieniu każdego dokumentu księgowego, system wysyła powiadomienie do sekcji „Poczta” wraz z linkiem do pobrania pliku PDF. Dokumenty te są trwale przechowywane w panelu, co ułatwia Państwu przekazywanie ich do własnej księgowości bez konieczności proszenia sekretariatu o duplikaty."
      },
      {
        q: "Czy płatności online realizowane przez Panel są bezpieczne?",
        a: "Tak, bezpieczeństwo transakcji finansowych jest dla nas absolutnie priorytetowe. Nie przechowujemy danych Państwa kart płatniczych ani danych dostępowych do bankowości na naszych serwerach. Cały proces płatności jest obsługiwany przez licencjonowanych operatorów (np. PayU, Przelewy24, Stripe), którzy posiadają certyfikaty PCI DSS. Po kliknięciu „Zapłać”, zostają Państwo przekierowani na bezpieczną stronę operatora, a po dokonaniu wpłaty wracają Państwo do Panelu z potwierdzeniem transakcji."
      },
      {
        q: "Co oznacza status płatności „Oczekująca” i jak długo może trwać?",
        a: "Status „Oczekująca” oznacza, że zainicjowali Państwo proces płatności, ale system nie otrzymał jeszcze cyfrowego potwierdzenia z banku o zaksięgowaniu środków. W przypadku szybkich przelewów (pay-by-link) lub płatności kartą, zmiana statusu na „Opłacona” następuje zazwyczaj w ciągu kilku minut. Jeśli jednak wykonali Państwo tradycyjny przelew bankowy, proces ten może potrwać od 1 do 2 dni roboczych. Jeśli po tym czasie status się nie zmieni, prosimy o przesłanie potwierdzenia przelewu w formacie PDF na nasz czat."
      },
      {
        q: "Czy mogę otrzymać fakturę pro-forma przed dokonaniem wpłaty?",
        a: "Tak, dla klientów preferujących przedpłaty lub potrzebujących dokumentu do akceptacji wydatku wewnątrz firmy, system umożliwia wygenerowanie faktury pro-forma. W sekcji „Płatności”, przy danej usłudze, należy wybrać opcję „Generuj Pro-forma”. Dokument ten zostanie natychmiast udostępniony do pobrania. Po odnotowaniu wpłaty na podstawie pro-formy, system automatycznie wystawi fakturę końcową i powiadomi o tym Państwa drogą e-mailową."
      },
      {
        q: "W jaki sposób mogę zmienić dane do faktury (np. na firmowe)?",
        a: "Dane do faktury można zaktualizować w dowolnym momencie w sekcji „Mój Profil” > „Dane do faktury”. Prosimy o dokonywanie zmian przed opłaceniem usługi, aby faktura została wygenerowana poprawnie za pierwszym razem. Zmiana danych po wystawieniu faktury końcowej wymaga kontaktu z działem księgowości kancelarii w celu wystawienia noty korygującej, co jest procedurą bardziej czasochłonną i wymagającą akceptacji obu stron."
      },
      {
        q: "Czy system obsługuje płatności cykliczne (subskrypcje) za stałą obsługę prawną?",
        a: "Tak, dla klientów korporacyjnych i osób korzystających z abonamentów prawnych, system oferuje funkcję płatności automatycznych. Można przypisać kartę płatniczą do swojego konta, a system będzie pobierał należność za stały ryczałt w określonym dniu miesiąca. Jest to rozwiązanie bardzo wygodne, które gwarantuje ciągłość ochrony prawnej bez konieczności pamiętania o terminach faktur. O każdej pobranej kwocie zostaną Państwo poinformowani osobną wiadomością e-mail wraz z załączoną fakturą."
      },
      {
        q: "Gdzie mogę sprawdzić historię moich wszystkich wpłat i należności?",
        a: "Pełne zestawienie finansowe dostępne jest w zakładce „Bilans Konta”. Znajdą tam Państwo tabelę z historią wszystkich operacji: datę, opis usługi, kwotę oraz status płatności. System podlicza również sumaryczne wydatki na obsługę prawną w wybranym okresie (np. rok podatkowy), co jest bardzo pomocne przy planowaniu budżetu firmy lub przygotowywaniu rozliczeń rocznych. Widoczne są tam również ewentualne nadpłaty, które mogą zostać zaliczone na poczet przyszłych usług."
      },
      {
        q: "Co zrobić, jeśli dokonałem płatności, a system nadal pokazuje zaległość?",
        a: "Taka sytuacja może wystąpić przy przelewach tradycyjnych lub przy błędach w komunikacji między systemem bankowym a naszym panelem. W pierwszej kolejności prosimy sprawdzić, czy kwota i tytuł przelewu były zgodne z danymi na fakturze. Jeśli wszystko się zgadza, a status nie zmienił się po 24h, prosimy o kontakt z nami poprzez „Bezpieczny Czat” i dołączenie potwierdzenia przelewu. Nasz dział księgowości manualnie zweryfikuje wpływ i zaktualizuje status w systemie, aby mogli Państwo bez przeszkód korzystać z usług."
      },
      {
        q: "Czy za pośrednictwem Panelu mogę opłacić koszty sądowe i opłaty skarbowe?",
        a: "Standardowo Panel służy do rozliczeń honorarium kancelarii. Jednak w niektórych przypadkach, jeśli tak przewiduje umowa, możemy wystawić notę obciążeniową na koszty sądowe, które kancelaria uiszcza w Państwa imieniu. Wtedy taka nota pojawia się w sekcji płatności obok faktur za usługi. Zawsze prosimy o precyzyjne czytanie opisu usługi przy płatności, aby wiedzieć, czy dotyczy ona wynagrodzenia prawnika, czy opłat urzędowych/sądowych niezbędnych do biegu sprawy."
      },
      {
        q: "Jakie metody płatności online są dostępne i która jest najszybsza?",
        a: "Obsługujemy szeroki wachlarz metod: szybkie przelewy online (większość polskich banków), karty płatnicze (Visa, Mastercard), BLIK oraz Google Pay/Apple Pay. Najszybszą metodą jest BLIK oraz szybki przelew online – potwierdzenie trafia do nas w kilka sekund, co pozwala na natychmiastowe odblokowanie zarezerwowanego terminu w kalendarzu lub uzyskanie dostępu do przygotowanej opinii prawnej. Tradycyjny przelew bankowy jest metodą najwolniejszą, zalecaną tylko w przypadku braku możliwości korzystania z e-płatności."
      }
    ]
  },
  {
    title: "Wsparcie Techniczne",
    items: [
      {
        q: "Z jakich przeglądarek najlepiej korzystać, aby Panel działał bezbłędnie?",
        a: "Nasz system jest zoptymalizowany pod kątem najnowszych wersji najpopularniejszych przeglądarek internetowych: Google Chrome, Mozilla Firefox, Microsoft Edge oraz Apple Safari. Wykorzystują one nowoczesne silniki renderujące, które zapewniają płynność działania kalendarza oraz bezpieczne przesyłanie plików. Odradzamy korzystanie z Internet Explorer oraz starszych wersji przeglądarek, ponieważ nie wspierają one nowoczesnych standardów bezpieczeństwa i mogą powodować błędy w wyświetlaniu interfejsu (np. brak reakcji przycisków)."
      },
      {
        q: "Panel wyświetla się niepoprawnie na moim smartfonie. Co mogę zrobić?",
        a: "Mimo że Panel jest responsywny, na starszych urządzeniach lub przy bardzo nietypowych rozdzielczościach ekranu mogą wystąpić błędy układu. W takiej sytuacji prosimy w pierwszej kolejności spróbować obrócić telefon do pozycji poziomej (landscape). Jeśli to nie pomoże, warto sprawdzić, czy nie mają Państwo włączonej opcji „Widok komputerowy” w przeglądarce mobilnej – jej wyłączenie przywróci dedykowany interfejs mobilny. Warto również wyczyścić cache przeglądarki w ustawieniach telefonu, co często rozwiązuje problemy z ładowaniem skryptów."
      },
      {
        q: "Zapomniałem hasła do Panelu Klienta. Jak mogę je bezpiecznie odzyskać?",
        a: "Na stronie logowania znajduje się link „Zapomniałem hasła”. Po jego kliknięciu i podaniu adresu e-mail użytego przy rejestracji, otrzymają Państwo wiadomość z unikalnym, jednorazowym linkiem do zresetowania hasła. Link jest ważny przez 60 minut ze względów bezpieczeństwa. Jeśli nie widzą Państwo e-maila w ciągu 5 minut, prosimy o sprawdzenie folderu Spam. Jeśli utracili Państwo dostęp również do swojej skrzynki e-mail, konieczny będzie osobisty kontakt z sekretariatem kancelarii w celu manualnej weryfikacji tożsamości i zresetowania dostępu."
      },
      {
        q: "Jak zgłosić błąd systemowy (bug), który uniemożliwia mi korzystanie z funkcji?",
        a: "Wszelkie nieprawidłowości prosimy zgłaszać poprzez Formularz Kontaktowy, wybierając temat „Problemy Techniczne”. Bardzo pomocne dla naszego zespołu IT będzie załączenie zrzutu ekranu (screenshot) błędu oraz podanie informacji o używanym urządzeniu (np. Windows 11 + Chrome). Dokładny opis, co stało się bezpośrednio przed błędem, pozwoli nam na szybszą diagnozę i naprawę. Każde zgłoszenie techniczne otrzymuje numer ticketu, a o postępach w naprawie będą Państwo informowani na bieżąco."
      },
      {
        q: "Dlaczego czasem widzę komunikat „Prace serwisowe” i jak długo one trwają?",
        a: "Prace serwisowe są niezbędne do wprowadzania aktualizacji bezpieczeństwa oraz nowych funkcjonalności. Staramy się planować je w godzinach najniższej aktywności użytkowników (zazwyczaj w nocy między 02:00 a 05:00 czasu polskiego lub w weekendy). Przerwa w dostępie trwa zazwyczaj od 15 do 60 minut. O planowanych dłuższych pracach informujemy z wyprzedzeniem 24-godzinnym poprzez komunikat na pulpicie Panelu, aby mogli Państwo zaplanować pobranie niezbędnych dokumentów przed przerwą."
      },
      {
        q: "Czy system posiada tryb ciemny (Dark Mode) dla wygody oczu?",
        a: "Tak, dbamy o komfort Państwa pracy, zwłaszcza wieczorami. Tryb ciemny można aktywować w „Ustawieniach Profilu” lub za pomocą ikony księżyca/słońca znajdującej się w prawym górnym rogu ekranu (obok imienia i nazwiska). Tryb ten zmniejsza emisję niebieskiego światła, co sprawia, że czytanie długich opinii prawnych i pism procesowych jest mniej męczące dla wzroku. Ustawienie to jest zapamiętywane dla danego konta na wszystkich urządzeniach, z których się Państwo logują."
      },
      {
        q: "W jaki sposób system powiadamia mnie o aktualizacjach Panelu?",
        a: "Informacje o nowych funkcjonalnościach publikujemy w sekcji „Aktualności” na głównym pulpicie po zalogowaniu. Jeśli zmiana dotyczy sposobu korzystania z Panelu (np. nowy sposób rezerwacji terminów), przygotowujemy krótki samouczek lub interaktywną instrukcję, która wyświetli się przy pierwszym logowaniu po aktualizacji. Zależy nam, aby Panel stale się rozwijał i był jak najbardziej przyjazny dla naszych klientów, dlatego każda zmiana jest poprzedzona testami UX."
      },
      {
        q: "Czy mogę połączyć (zintegrować) kalendarz z Panelu z moim Google Calendar lub Outlook?",
        a: "Obecnie pracujemy nad funkcją eksportu terminów w formacie iCal. Pozwoli to Państwu na subskrybowanie terminów kancelaryjnych w Państwa prywatnych kalendarzach. Do czasu wdrożenia tej funkcji, zalecamy korzystanie z powiadomień e-mail, które zawierają plik zaproszenia (.ics) – po jego kliknięciu w mailu, wydarzenie zostanie automatycznie dodane do Państwa systemowego kalendarza na komputerze lub telefonie."
      },
      {
        q: "Jak wyczyścić pamięć podręczną (cache) przeglądarki, gdy Panel działa wolno?",
        a: "Jeśli Panel działa ociężale, najskuteczniejszą metodą jest tzw. „Twarde odświeżenie” (Hard Reload). Na systemie Windows należy nacisnąć kombinację klawiszy Ctrl + F5, a na systemie macOS – Cmd + Shift + R. Jeśli to nie pomoże, należy wejść w ustawienia prywatności przeglądarki i wybrać „Wyczyść dane przeglądania”, zaznaczając tylko „Obrazy i pliki zapisane w pamięci podręcznej”. To działanie nie usunie Państwa haseł, ale zmusi przeglądarkę do pobrania najnowszej, szybszej wersji kodu naszego systemu."
      },
      {
        q: "Gdzie znajdę instrukcję wideo dotyczącą obsługi wszystkich funkcji Panelu?",
        a: "W sekcji „Pomoc” znajduje się zakładka „Samouczki Wideo”. Przygotowaliśmy serię krótkich, profesjonalnych filmów (trwających od 1 do 3 minut), które krok po kroku pokazują, jak umówić konsultację, jak przesłać dokumenty na czacie oraz jak sprawnie poruszać się po repozytorium faktur. Filmy te are opatrzone komentarzem lektora i są najszybszym sposobem na pełne opanowanie wszystkich możliwości, jakie daje nasz system wsparcia prawnego online."
      }
    ]
  }
];
