from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models import User, UserProfile, FinanceMetric, TrafficMetric, SystemSetting, AuditLog, FormTemplate, FormFieldMapping, LegalTemplate
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import random
import logging
import uuid

logger = logging.getLogger(__name__)

async def init_db(db: AsyncSession) -> None:
    """
    Seed database with initial data.
    """
    users_to_create = [
        {
            "email": "admin@lexportal.pl",
            "password": "admin123",
            "role": "admin",
            "full_name": "Admin User",
            "is_superuser": True
        },
        {
            "email": "anna.nowak@lexportal.pl",
            "password": "lawyer123",
            "role": "operator",
            "full_name": "Anna Nowak"
        },
        {
            "email": "jan.kowalski@example.com",
            "password": "password123",
            "role": "client",
            "full_name": "Jan Kowalski"
        },
    ]

    count = 0
    for user_data in users_to_create:
        result = await db.execute(select(User).where(User.email == user_data["email"]))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            # Update role if it has changed in seed config
            if existing_user.role != user_data["role"]:
                existing_user.role = user_data["role"]
                logger.info(f"Updated role for {user_data['email']}: -> {user_data['role']}")
            continue

        hashed_password = get_password_hash(user_data["password"])
        new_user = User(
            email=user_data["email"],
            password_hash=hashed_password,
            role=user_data["role"],
            full_name=user_data["full_name"],
            is_active=True,
            is_superuser=user_data.get("is_superuser", False)
        )
        db.add(new_user)
        await db.flush() # Flush to get the new_user.id for the profile

        profile = UserProfile(user_id=new_user.id)
        db.add(profile)
        count += 1

    # Seed Dashboard Metrics
    result = await db.execute(select(FinanceMetric).limit(1))
    if not result.scalar_one_or_none():
        logger.info("Seeding Dashboard Metrics...")
        now = datetime.utcnow()
        for i in range(30):
            date = now - timedelta(days=i)
            # Finance
            f_metric = FinanceMetric(
                date=date,
                revenue_actual=random.uniform(1000, 5000),
                revenue_predicted=random.uniform(1200, 6000),
                costs=random.uniform(500, 2000)
            )
            db.add(f_metric)
            # Traffic
            for _ in range(random.randint(50, 200)):
                t_metric = TrafficMetric(
                    timestamp=date - timedelta(hours=random.randint(0, 23)),
                    page_path="/",
                    visitor_id=str(uuid.uuid4()),
                    event_type="view"
                )
                db.add(t_metric)
        count += 1

    # Seed System Settings
    result = await db.execute(select(SystemSetting).limit(1))
    if not result.scalar_one_or_none():
        logger.info("Seeding System Settings...")
        settings_to_create = [
            {"key": "platform_name", "value": "LexPortal Pro", "category": "general", "description": "Public name of the platform"},
            {"key": "system_limit_docs", "value": "100", "category": "limits", "description": "Max documents per case"},
            {"key": "email_notifications_enabled", "value": "true", "category": "notifications", "description": "Global email notification switch"},
            {"key": "maintenance_mode", "value": "false", "category": "system", "description": "Enable maintenance mode"},
        ]
        for s in settings_to_create:
            db.add(SystemSetting(**s))
        count += 1

    # Seed some Audit Logs
    result = await db.execute(select(AuditLog).limit(1))
    if not result.scalar_one_or_none():
        logger.info("Seeding Audit Logs...")
        # Get user IDs for seeding
        res = await db.execute(select(User.id))
        user_ids = [r[0] for r in res.all()]
        
        actions = ["USER_LOGIN", "DOCUMENT_UPLOAD", "CASE_CREATED", "SETTINGS_UPDATED", "USER_DELETED"]
        statuses = ["success", "success", "success", "failed", "success"]
        for i in range(20):
            idx = random.randint(0, len(actions) - 1)
            db.add(AuditLog(
                action=actions[idx],
                actor_id=random.choice(user_ids) if user_ids and random.random() > 0.3 else None,
                ip_address=f"192.168.1.{random.randint(1, 254)}",
                status=statuses[idx],
                timestamp=datetime.utcnow() - timedelta(minutes=random.randint(0, 10000)),
                details={"info": f"Seed log entry {i}"}
            ))
        count += 1

    # Seed Form Templates (LexPortal Document Creator)
    result = await db.execute(select(FormTemplate).limit(1))
    if not result.scalar_one_or_none():
        logger.info("Seeding Form Templates...")
        zus_emp_schema = {
            "form_title": "Wniosek o emeryturę (ZUS EMP)",
            "form_code": "ZUS_EMP_2026",
            "steps": [
                {
                    "step_id": 1,
                    "step_title": "Dane Osobowe",
                    "fields": [
                        {
                            "id": "first_name",
                            "label": "Imię",
                            "type": "text",
                            "placeholder": "Wpisz imię",
                            "validation": { "required": True, "minLength": 2 },
                            "ui_width": "half"
                        },
                        {
                            "id": "last_name",
                            "label": "Nazwisko",
                            "type": "text",
                            "placeholder": "Wpisz nazwisko",
                            "validation": { "required": True, "minLength": 2 },
                            "ui_width": "half"
                        },
                        {
                            "id": "pesel",
                            "label": "Numer PESEL",
                            "type": "text",
                            "placeholder": "00000000000",
                            "validation": { 
                                "required": True, 
                                "pattern": "^[0-9]{11}$",
                                "message": "PESEL musi składać się z 11 cyfr" 
                            },
                            "ui_width": "full"
                        }
                    ]
                },
                {
                    "step_id": 2,
                    "step_title": "Zakres Wniosku",
                    "fields": [
                        {
                            "id": "benefit_type",
                            "label": "Rodzaj świadczenia",
                            "type": "select",
                            "options": [
                                { "value": "old_age", "label": "Emerytura" },
                                { "value": "disability", "label": "Renta z tytułu niezdolności do pracy" },
                                { "value": "survivors", "label": "Renta rodzinna" }
                            ],
                            "validation": { "required": True }
                        },
                        {
                            "id": "bank_account",
                            "label": "Numer konta do wypłat",
                            "type": "text",
                            "placeholder": "PL 00 0000 ...",
                            "validation": { "required": True, "pattern": "^[0-9]{26}$" }
                        }
                    ]
                },
                {
                    "step_id": 3,
                    "step_title": "Oświadczenia",
                    "fields": [
                        {
                            "id": "legal_consent",
                            "label": "Oświadczam, że dane są zgodne z prawdą pod rygorem odpowiedzialności karnej.",
                            "type": "checkbox",
                            "validation": { "required": True }
                        }
                    ]
                }
            ],
            "completion_settings": {
                "submit_button_text": "Generuj i Podpisz Autenti",
                "success_message": "Wniosek został poprawnie wygenerowany."
            }
        }
        
        template = FormTemplate(
            id=uuid.uuid4(),
            code="ZUS_EMP_2026",
            title="Wniosek o emeryturę (ZUS EMP)",
            category="Ubezpieczenia Społeczne",
            pdf_template_path="app/static/templates/ZUS_EMP.pdf",
            is_active=True,
            schema_definition=zus_emp_schema
        )
        db.add(template)
        await db.flush()
        
        # Mappings
        mappings = [
            {"frontend_key": "first_name", "pdf_field_name": "form1[0].Page1[0].Imie[0]"},
            {"frontend_key": "last_name", "pdf_field_name": "form1[0].Page1[0].Nazwisko[0]"},
            {"frontend_key": "pesel", "pdf_field_name": "identyfikator_pesel"},
            {"frontend_key": "bank_account", "pdf_field_name": "numer_konta"},
        ]
        for m in mappings:
            db.add(FormFieldMapping(template_id=template.id, **m))
        
        # 2. ZUS US-7
        zus_us7_schema = {
            "form_title": "Wniosek o zaświadczenie o niezaleganiu (ZUS US-7)",
            "form_code": "ZUS_US7_2026",
            "steps": [
                {
                    "step_id": 1,
                    "step_title": "Dane Wnioskodawcy",
                    "fields": [
                        {
                            "id": "tax_id",
                            "label": "NIP / PESEL",
                            "type": "text",
                            "placeholder": "Wpisz identyfikator",
                            "validation": { "required": True },
                            "ui_width": "half"
                        },
                        {
                            "id": "company_name",
                            "label": "Nazwa / Imię i Nazwisko",
                            "type": "text",
                            "placeholder": "Pełna nazwa",
                            "validation": { "required": True },
                            "ui_width": "half"
                        }
                    ]
                },
                {
                    "step_id": 2,
                    "step_title": "Cel wydania",
                    "fields": [
                        {
                            "id": "purpose",
                            "label": "Cel wydania zaświadczenia",
                            "type": "textarea",
                            "placeholder": "Np. przetarg, kredyt...",
                            "validation": { "required": True }
                        }
                    ]
                }
            ],
            "completion_settings": {
                "submit_button_text": "Generuj Wniosek",
                "success_message": "Wniosek US-7 został przygotowany."
            }
        }
        
        template2 = FormTemplate(
            id=uuid.uuid4(),
            code="ZUS_US7_2026",
            title="Wniosek o niezaleganiu (ZUS US-7)",
            category="Zaświadczenia",
            pdf_template_path="app/static/templates/ZUS_US_7.pdf",
            is_active=True,
            schema_definition=zus_us7_schema
        )
        db.add(template2)
        await db.flush()
        
        mappings_us7 = [
            {"frontend_key": "tax_id", "pdf_field_name": "Identyfikator"},
            {"frontend_key": "company_name", "pdf_field_name": "Nazwa"},
            {"frontend_key": "purpose", "pdf_field_name": "Cel"},
        ]
        for m in mappings_us7:
            db.add(FormFieldMapping(template_id=template2.id, **m))

        count += 1

    # Seed Legal Templates (Markdown Smart Templates)
    logger.info("Checking Legal Templates...")
    legal_templates = [
        {
            "custom_id": "T-OFFER-001",
            "title": "Oferta Handlowa",
            "category": "Sales",
            "description": "Standardowa oferta handlowa z podpisem elektronicznym.",
            "fields": [
                {"id": "OFERENT_NAZWA", "label": "Nazwa Oferenta", "type": "string", "required": True},
                {"id": "ADRESAT_NAZWA", "label": "Nazwa Adresata", "type": "string", "required": True},
                {"id": "PRODUKTY_LISTA", "label": "Lista Produktów/Usług", "type": "text", "placeholder": "1. Usługa X..."},
                {"id": "WARUNKI_PLATNOSCI", "label": "Warunki Płatności", "type": "string", "default": "Przelew 14 dni"},
                {"id": "DATA_WAZNOSCI", "label": "Termin ważności oferty", "type": "date", "required": True}
            ],
            "ai_hints": "Zasugeruj profesjonalny opis korzyści dla sekcji 'Dodatkowe informacje' na podstawie branży klienta.",
            "content": """# SZABLON: OFERTA HANDLOWA
# ID: T-OFFER-001

Oferent: {{OFERENT_NAZWA}}, {{OFERENT_ADRES}}, reprezentowany przez {{OFERENT_REPREZENTANT}}
Adresat oferty: {{ADRESAT_NAZWA}}, {{ADRESAT_ADRES}}, reprezentowany przez {{ADRESAT_REPREZENTANT}}

Oferta na produkty/usługi:
1. {{PRODUKT_1}}
2. {{PRODUKT_2}}
3. {{PRODUKT_3}}

Dodatkowe informacje o ofercie:
{{DODATKOWE_INFORMACJE}}

Warunki dostawy:
{{WARUNKI_DOSTAWY}}

Warunki płatności:
{{WARUNKI_PLATNOSCI}}

Oferta ważna do: {{DATA_WAZNOSCI}}

---
[INFO SYSTEMOWE]
Oferta została podpisana elektronicznie przez Oferenta. Adresat oferty potwierzza przyjęcie i akceptację oferty przez złożenie podpisu elektronicznego. Przyjęcie oferty następuje z dniem jej podpisania przez Adresata oferty."""
        },
        {
            "custom_id": "T-WORK-002",
            "title": "Umowa o Dzieło",
            "category": "Legal",
            "description": "Umowa z przeniesieniem praw autorskich (IP Transfer).",
            "fields": [
                {"id": "DATA_UMOWY", "label": "Data zawarcia", "type": "date", "required": True},
                {"id": "OPIS_DZIELA", "label": "Opis przedmiotu dzieła", "type": "text", "required": True},
                {"id": "TERMIN_WYKONANIA", "label": "Termin oddania", "type": "date", "required": True},
                {"id": "KWOTA_BRUTTO", "label": "Wynagrodzenie Brutto", "type": "currency", "required": True},
                {"id": "POLA_EKSPLOATACJI", "label": "Pola eksploatacji", "type": "select_multiple", "options": ["Internet", "Druk", "Software", "TV"], "default": ["Internet", "Druk"]}
            ],
            "validation_rules": {
                "min_advance_notice": "7 days",
                "require_pesel_or_nip": True
            },
            "content": """# SZABLON: UMOWA O DZIEŁO
# ID: T-WORK-002

Zawarta w dniu {{DATA_UMOWY}}, w {{MIEJSCOWOSC}}, pomiędzy:
{{ZAMAWIAJACY_DANE_PELNE}} (dalej "Zamawiający")
a
{{WYKONAWCA_DANE_PELNE}} (dalej "Wykonawca")

§ 1 [Przedmiot Umowy]
1. Przedmiotem dzieła jest: {{OPIS_DZIELA}}.
2. Dzieło tworzone będzie w oparciu o wytyczne Zamawiającego.

§ 2 [Terminy]
1. Termin wykonania: do dnia {{TERMIN_WYKONANIA}}.
2. Odbiór w formie: {{FORMA_ODBIORU_NP_CYFROWA}}.
3. Czas na akceptację/poprawki: {{ILOSC_DNI_AKCEPTACJA}} dni.

§ 4 [Prawa autorskie - KLUCZOWE]
Wykonawca przenosi na Zamawiającego autorskie prawa majątkowe na polach eksploatacji: {{POLA_EKSPLOATACJI_LISTA_LUB_STANDARD}}.
[LOGIKA AI: Jeśli dzieło to program, dodaj zapis o kodzie źródłowym].

§ 5 [Wynagrodzenie]
1. Wynagrodzenie: {{KWOTA_BRUTTO}} zł (słownie: {{KWOTA_SLOWNIE}}).
2. Płatność na podstawie rachunku/faktury w terminie {{TERMIN_PLATNOSCI}} dni.

§ 6 [Kary umowne]
W razie zwłoki Wykonawca zapłaci {{PROCENT_KARY}}% wartości dzieła za każdy dzień zwłoki."""
        },
        {
            "custom_id": "T-NDA-003",
            "title": "Umowa o Zachowaniu Poufności (NDA)",
            "category": "Security",
            "description": "Zabezpieczenie informacji poufnych z karą umowną.",
            "fields": [
                {"id": "STRONY_DANE", "label": "Dane stron", "type": "text", "required": True},
                {"id": "ZAKRES_POUFNOSCI", "label": "Co jest poufne?", "type": "text", "default": "Wszystkie informacje techniczne, finansowe i handlowe."},
                {"id": "ILOSC_LAT", "label": "Okres ochrony (lata)", "type": "number", "default": 5},
                {"id": "KWOTA_KARY", "label": "Wysokość kary umownej (PLN)", "type": "currency", "required": True}
            ],
            "ai_hints": "Jeśli kara umowna jest wyższa niż 50 000 PLN, dodaj klauzulę o możliwości dochodzenia odszkodowania uzupełniającego.",
            "content": """# SZABLON: UMOWA NDA (NON-DISCLOSURE AGREEMENT)
# ID: T-NDA-003

Strony: {{STRONA_UJAWNIAJACA}} oraz {{STRONA_OTRZYMUJACA}}.

§ 1 [Informacje Poufne]
Za informacje poufne uznaje się: {{ZAKRES_POUFNOSCI_NP_TECHNICZNE_FINANSOWE}}.

§ 2 [Okres obowiązywania]
Obowiązek zachowania poufności trwa przez okres {{ILOSC_LAT_POUFNOSC}} lat od otrzymania informacji.

§ 5 [Kara umowna]
Za naruszenie poufności Strona Otrzymująca zapłaci karę w wysokości {{KWOTA_KARY_NDA}} zł za każdy przypadek naruszenia."""
        },
        {
            "custom_id": "T-LOAN-004",
            "title": "Umowa Pożyczki",
            "category": "Finance",
            "description": "Umowa pożyczki pieniężnej między osobami/firmami.",
            "fields": [
                {"id": "KWOTA_POZYCZKI", "label": "Kwota (PLN)", "type": "currency", "required": True},
                {"id": "NR_KONTA", "label": "Numer konta do wypłaty", "type": "string", "pattern": "^[0-9]{26}$"},
                {"id": "DATA_ZWROTU", "label": "Termin zwrotu", "type": "date", "required": True},
                {"id": "ODSETKI", "label": "Odsetki karne (%)", "type": "number", "default": 12}
            ],
            "logic": "Jeśli kwota > 1000 PLN, wymuszaj formę dokumentową pod rygorem nieważności (Art. 720 KC).",
            "content": """# SZABLON: UMOWA POŻYCZKI
# ID: T-LOAN-004

Pożyczkodawca: {{POZYCZKODAWCA_DANE}}
Pożyczkobiorca: {{POZYCZKOBIORCA_DANE}}

§ 1 [Kwota]
Kwota pożyczki: {{KWOTA_POZYCZKI}} zł. Przelew na konto: {{NUMER_KONTA_POZYCZKOBIORCY}} w terminie {{TERMIN_PRZELEWU}} dni.

§ 2 [Zwrot]
Termin zwrotu: {{DATA_ZWROTU}}.
Odsetki za opóźnienie: {{PROCENT_ODSETEK}}% w skali roku."""
        },
        {
            "custom_id": "T-MANDATE-005",
            "title": "Umowa Zlecenie",
            "category": "HR",
            "description": "Umowa o świadczenie usług (staranność działania).",
            "fields": [
                {"id": "ZLECENIOBIORCA_DANE", "label": "Dane Zleceniobiorcy", "type": "text", "required": True},
                {"id": "OPIS_ZLECENIA", "label": "Zakres czynności", "type": "text", "required": True},
                {"id": "STAWKA_GODZINA", "label": "Stawka godzinowa Brutto", "type": "currency", "required": True},
                {"id": "MINIMUM_LOG", "label": "Wymóg ewidencji godzin", "type": "boolean", "default": True}
            ],
            "content": """# SZABLON: UMOWA ZLECENIE
# ID: T-MANDATE-005

Zleceniodawca: {{ZLECENIODAWCA_DANE}}
Zleceniobiorca: {{ZLECENIOBIORCA_DANE}}

§ 1 [Czynności]
Zleceniobiorca zobowiązuje się do: {{OPIS_CZYNNOSCI}}.

§ 2 [Wynagrodzenie]
Stawka: {{STAWKA_GODZINA_LUB_RYCZALT}} zł brutto. Płatne na podstawie rachunku.

§ 4 [Okres]
Umowa zawarta na czas: {{OKRES_TRWANIA_OD_DO}}."""
        },
        {
            "custom_id": "T-CONSENT-006",
            "title": "Zgoda Rodzica / RODO",
            "category": "Compliance",
            "description": "Zgoda na przetwarzanie danych nieletniego w systemach IT.",
            "is_active": False,
            "fields": [
                {"id": "UCZEN_NAZWISKO", "label": "Imię i Nazwisko Dziecka", "type": "string", "required": True},
                {"id": "RODZIC_NAZWISKO", "label": "Imię i Nazwisko Opiekuna", "type": "string", "required": True},
                {"id": "SYSTEM_NAZWA", "label": "Nazwa Systemu (np. G-Suite)", "type": "string", "required": True},
                {"id": "EMAIL_KONTAKT", "label": "Email do potwierdzenia", "type": "email", "required": True}
            ],
            "content": """# SZABLON: ZGODA RODO / G-SUITE
# ID: T-CONSENT-006

Uczeń: {{IMIE_NAZWISKO_UCZNIA}}
Rodzic/Opiekun: {{IMIE_NAZWISKO_RODZICA}}

Wyrażam zgodę na utworzenie konta w usłudze {{NAZWA_USLUGI}} dla mojego dziecka. Przyjmuję do wiadomości, że dane przetwarzane są w celu {{CEL_PRZETWARZANIA}}.

Podpisano elektronicznie w dniu: {{DATA_PODPISU}}."""
        }
    ]

    for t in legal_templates:
        result = await db.execute(select(LegalTemplate).where(LegalTemplate.custom_id == t["custom_id"]))
        existing = result.scalar_one_or_none()
        if not existing:
            db.add(LegalTemplate(**t))
            count += 1
        else:
            # Update existing if needed
            for key, value in t.items():
                setattr(existing, key, value)
            count += 1

    if count > 0:
        await db.commit()
        logger.info(f"Database seeded with {count} new users.")
    else:
        logger.info("Database already seeded.")
