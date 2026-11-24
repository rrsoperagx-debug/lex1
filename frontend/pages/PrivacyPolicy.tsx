import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  UserCheck,
  FileText,
  Mail,
  ArrowRight,
  Download,
  Scale,
  ChevronDown,
} from "lucide-react";

const PrivacyPolicy: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>(
    "administrator",
  );

  const toggleAccordion = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-20">
      {/* Premium Header */}
      <header className="bg-[#0a2540] text-white py-16 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 text-gold-500 border border-gold-500/30 text-xs font-bold uppercase tracking-widest mb-6">
            <Lock className="w-3 h-3" /> Zgodność z RODO / GDPR
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Polityka Prywatności i Ochrony Danych
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Transparentność i bezpieczeństwo Twoich danych to nasz priorytet.
            Poniżej znajdziesz szczegółowe informacje o tym, jak dbamy o Twoją
            prywatność.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-5">
          <Scale className="w-96 h-96 -mb-24 -mr-24 transform -rotate-12" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 -mt-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Side Navigation (Table of Contents) */}
          <aside className="lg:w-1/4 h-fit sticky top-24 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 no-print">
            <h3 className="text-navy-950 font-bold text-lg mb-6 border-b border-slate-100 pb-4">
              Spis Treści
            </h3>
            <nav className="space-y-1">
              {[
                {
                  id: "administrator",
                  label: "Administrator Danych",
                  icon: <UserCheck className="w-4 h-4" />,
                },
                {
                  id: "cele",
                  label: "Cele I Podstawy",
                  icon: <Database className="w-4 h-4" />,
                },
                {
                  id: "prawa",
                  label: "Twoje Prawa",
                  icon: <ShieldCheck className="w-4 h-4" />,
                },
                {
                  id: "cookies",
                  label: "Pliki Cookies",
                  icon: <Eye className="w-4 h-4" />,
                },
                {
                  id: "kontakt",
                  label: "Kontakt IOD",
                  icon: <Mail className="w-4 h-4" />,
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-medium text-sm group ${
                    activeSection === item.id
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                      : "text-slate-600 hover:bg-slate-50 hover:text-navy-950"
                  }`}
                >
                  <span
                    className={`${activeSection === item.id ? "text-gold-500" : "text-slate-400 group-hover:text-gold-500"} transition-colors`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                  <ArrowRight
                    className={`w-4 h-4 ml-auto transition-all ${activeSection === item.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`}
                  />
                </button>
              ))}
            </nav>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-navy-950 transition-all shadow-lg shadow-slate-900/10"
              >
                <Download className="w-4 h-4" /> Pobierz PDF
              </button>
            </div>
          </aside>

          {/* Main Content (Accordions) */}
          <main className="lg:w-3/4 space-y-4 print:w-full">
            {/* 1. Administrator */}
            <div
              id="administrator"
              className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
            >
              <button
                onClick={() => toggleAccordion("administrator")}
                className="w-full flex items-center justify-between p-8 lg:px-12 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-500">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold text-navy-950">
                    1. Administrator Danych Osobowych
                  </h2>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-slate-400 transition-transform ${activeSection === "administrator" ? "rotate-180" : ""}`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${activeSection === "administrator" ? "max-h-[1000px] opacity-100 pb-12" : "max-h-0 opacity-0"}`}
              >
                <div className="px-8 lg:px-12 prose prose-slate max-w-none text-slate-600 leading-relaxed border-t border-slate-50 pt-8">
                  <p className="mb-4 font-normal">
                    Administratorem Twoich danych osobowych jest{" "}
                    <strong>Kancelaria Prawna LexPortal Sp. z o.o.</strong> z
                    siedzibą w Warszawie (00-001), ul. Nowy Świat 1, wpisana do
                    rejestru przedsiębiorców Krajowego Rejestru Sądowego pod
                    numerem KRS: 0000000000.
                  </p>
                  <p className="font-normal">
                    W sprawach związanych z przetwarzaniem danych osobowych oraz
                    realizacją praw przysługujących Ci na mocy RODO, możesz
                    skontaktować się z naszym Inspektorem Ochrony Danych (IOD)
                    pod adresem e-mail:{" "}
                    <code className="bg-slate-100 px-2 py-1 rounded text-navy-950 font-bold">
                      iod@lexportal.pl
                    </code>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Cele i Podstawy */}
            <div
              id="cele"
              className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
            >
              <button
                onClick={() => toggleAccordion("cele")}
                className="w-full flex items-center justify-between p-8 lg:px-12 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Database className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold text-navy-950">
                    2. Cele i Podstawy Przetwarzania
                  </h2>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-slate-400 transition-transform ${activeSection === "cele" ? "rotate-180" : ""}`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${activeSection === "cele" ? "max-h-[2000px] opacity-100 pb-12" : "max-h-0 opacity-0"}`}
              >
                <div className="px-8 lg:px-12 border-t border-slate-50 pt-8">
                  <div className="grid md:grid-cols-2 gap-6 mt-2">
                    {[
                      {
                        title: "Realizacja Umowy",
                        desc: "Przetwarzamy dane w celu świadczenia pomocy prawnej i obsługi Twoich zleceń.",
                        base: "Art. 6 ust. 1 lit. b RODO",
                      },
                      {
                        title: "Obowiązek Prawny",
                        desc: "Wymogi podatkowe, księgowe oraz archiwizacyjne narzucone przez polskie prawo.",
                        base: "Art. 6 ust. 1 lit. c RODO",
                      },
                      {
                        title: "Prawnie Uzasadniony Interes",
                        desc: "Zapewnienie bezpieczeństwa platformy, dochodzenie roszczeń i obrona przed nimi.",
                        base: "Art. 6 ust. 1 lit. f RODO",
                      },
                      {
                        title: "Zgoda Użytkownika",
                        desc: "Wysyłka newslettera oraz analizy statystyczne dotyczące korzystania z serwisu.",
                        base: "Art. 6 ust. 1 lit. a RODO",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-gold-500/30 transition-all"
                      >
                        <h4 className="font-bold text-navy-950 mb-2">
                          {item.title}
                        </h4>
                        <p className="text-sm text-slate-500 mb-4 font-normal leading-relaxed">
                          {item.desc}
                        </p>
                        <span className="text-[10px] bg-white px-2 py-1 rounded-full border border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                          Podstawa: {item.base}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Twoje Prawa */}
            <div
              id="prawa"
              className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
            >
              <button
                onClick={() => toggleAccordion("prawa")}
                className="w-full flex items-center justify-between p-8 lg:px-12 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold text-navy-950">
                    3. Twoje Prawa
                  </h2>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-slate-400 transition-transform ${activeSection === "prawa" ? "rotate-180" : ""}`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${activeSection === "prawa" ? "max-h-[1000px] opacity-100 pb-12" : "max-h-0 opacity-0"}`}
              >
                <div className="px-8 lg:px-12 border-t border-slate-50 pt-8 space-y-4">
                  {[
                    "Prawo dostępu do treści swoich danych oraz otrzymania ich kopii",
                    "Prawo do sprostowania (poprawiania) swoich danych",
                    "Prawo do usunięcia danych („prawo do bycia zapomnianym”)",
                    "Prawo do ograniczenia przetwarzania",
                    "Prawo do przenoszenia danych",
                    "Prawo do sprzeciwu wobec przetwarzania",
                  ].map((text, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all font-normal"
                    >
                      <div className="mt-1 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <UserCheck className="w-3 h-3" />
                      </div>
                      <span className="text-slate-600">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Pliki Cookies */}
            <div
              id="cookies"
              className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
            >
              <button
                onClick={() => toggleAccordion("cookies")}
                className="w-full flex items-center justify-between p-8 lg:px-12 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Eye className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold text-navy-950">
                    4. Pliki Cookies
                  </h2>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-slate-400 transition-transform ${activeSection === "cookies" ? "rotate-180" : ""}`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${activeSection === "cookies" ? "max-h-[1000px] opacity-100 pb-12" : "max-h-0 opacity-0"}`}
              >
                <div className="px-8 lg:px-12 border-t border-slate-50 pt-8 space-y-8">
                  <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-normal">
                    <p>
                      Serwis LexPortal wykorzystuje pliki cookies (powszechnie
                      znane jako „ciasteczka”), które są danymi informatycznymi
                      przechowywanymi w Twoim urządzeniu. Dzielimy je na dwie
                      kategorie:
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100">
                      <div className="flex items-center gap-3 mb-4">
                        <Lock className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-bold text-indigo-950">
                          Pliki Niezbędne
                        </h4>
                      </div>
                      <p className="text-sm text-indigo-900 leading-relaxed font-normal">
                        Kluczowe dla prawidłowego działania serwisu. Umożliwiają
                        utrzymanie sesji po zalogowaniu, zapewniają
                        bezpieczeństwo transakcji oraz chronią przed
                        nadużyciami. Bez nich korzystanie z platformy byłoby
                        niemożliwe.
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-3 mb-4">
                        <Eye className="w-5 h-5 text-slate-600" />
                        <h4 className="font-bold text-slate-950">
                          Pliki Analityczne
                        </h4>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-normal">
                        Pomagają nam zrozumieć, jak użytkownicy korzystają z
                        serwisu, co pozwala na optymalizację jego wydajności i
                        układu. Dane te są zbierane anonimowo i{" "}
                        <strong>nie służą do profilowania reklamowego</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Kontakt IOD */}
            <div
              id="kontakt"
              className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
            >
              <button
                onClick={() => toggleAccordion("kontakt")}
                className="w-full flex items-center justify-between p-8 lg:px-12 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold text-navy-950">
                    5. Kontakt z Inspektorem (IOD)
                  </h2>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-slate-400 transition-transform ${activeSection === "kontakt" ? "rotate-180" : ""}`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${activeSection === "kontakt" ? "max-h-[1000px] opacity-100 pb-12" : "max-h-0 opacity-0"}`}
              >
                <div className="px-8 lg:px-12 border-t border-slate-50 pt-8">
                  <div className="bg-slate-50 p-8 rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-600 mb-6 text-center italic font-normal">
                      „Z powołanym Inspektorem Ochrony Danych możesz
                      skontaktować się bezpośrednio w każdej sprawie dotyczącej
                      Twojej prywatności.”
                    </p>
                    <div className="flex flex-col items-center gap-4">
                      <a
                        href="mailto:iod@lexportal.pl"
                        className="flex items-center gap-3 bg-navy-950 text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-navy-950/20"
                      >
                        <Mail className="w-5 h-5 text-gold-500" />
                        Wyślij wiadomość: iod@lexportal.pl
                      </a>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        Gwarantowany czas odpowiedzi: do 48h
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="bg-navy-950 rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl no-print">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gold-500 flex items-center justify-center shrink-0">
                  <Lock className="w-8 h-8 lg:w-10 lg:h-10 text-navy-950" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-4">
                    Gwarancja Bezpieczeństwa
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-xl font-normal">
                    Stosujemy zaawansowane szyfrowanie AES-256 oraz protokoły
                    SSL/TLS, aby Twoja korespondencja z prawnikiem pozostawała w
                    pełni poufna. Dane są przechowywane wyłącznie na
                    certyfikowanych serwerach zlokalizowanych w Unii
                    Europejskiej.
                  </p>
                </div>
              </div>
              <FileText className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5" />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
