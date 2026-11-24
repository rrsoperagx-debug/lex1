import React, { useState } from "react";
import {
  HelpCircle,
  Phone,
  Mail,
  MessageSquare,
  ChevronDown,
  Send,
  CheckCircle,
  FileText,
  Shield,
  ExternalLink,
  Globe,
  BookOpen,
  Search,
  Calendar,
  CreditCard,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { faqCategories, FAQCategory, FAQItem } from "../utils/faqData";

const Help: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "Pomoc techniczna",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setTicketNumber(Math.floor(Math.random() * 10000));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const getCategoryIcon = (title: string) => {
    switch (title) {
      case "Konto i Bezpieczeństwo Danych":
        return <Shield className="w-5 h-5" />;
      case "Terminarz i Konsultacje":
        return <Calendar className="w-5 h-5" />;
      case "Bezpieczny Czat i Komunikacja":
        return <MessageSquare className="w-5 h-5" />;
      case "Obsługa Plików i Dokumentów":
        return <FileText className="w-5 h-5" />;
      case "Poczta i Wiadomości Systemowe":
        return <Mail className="w-5 h-5" />;
      case "Płatności i Rozliczenia":
        return <CreditCard className="w-5 h-5" />;
      case "Wsparcie Techniczne":
        return <Settings className="w-5 h-5" />;
      default:
        return <HelpCircle className="w-5 h-5" />;
    }
  };

  const filteredFaqs = faqCategories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  const displayedCategories = searchQuery
    ? filteredFaqs
    : activeCategory
      ? faqCategories.filter((c) => c.title === activeCategory)
      : faqCategories;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header Section */}
      <div className="bg-slate-900 py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-sans font-bold text-white mb-6 tracking-tight">
            Centrum Pomocy <span className="text-blue-400">LexPortal</span>
          </h1>
          <p className="text-slate-400 text-xl mb-10 max-w-2xl mx-auto font-light">
            Profesjonalne wsparcie prawne i techniczne dostępne na wyciągnięcie
            ręki.
          </p>
          <div className="relative max-w-2xl mx-auto group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-6 h-6 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Wpisz pytanie (np. jak usunąć konto, faktura, czat)..."
              className="w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl py-5 pl-14 pr-6 text-white placeholder-slate-500 shadow-2xl focus:ring-2 focus:ring-blue-500/50 focus:bg-slate-800 outline-none transition-all text-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column: Quick Contact & Links */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-900 text-xl mb-6 flex items-center gap-2">
                Szybki Kontakt
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Infolinia</p>
                    <p className="text-slate-600 text-sm">
                      Pn-Pt, 8:00 - 18:00
                    </p>
                    <p className="text-blue-600 font-bold mt-1">
                      +48 500 000 000
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-green-50 p-3 rounded-xl text-green-600">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">E-mail</p>
                    <p className="text-slate-600 text-sm">Odpowiadamy w 24h</p>
                    <p className="text-blue-600 font-bold mt-1">
                      pomoc@lexportal.pl
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-start gap-4 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
                  onClick={() => navigate("/assistant")}
                >
                  <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      Asystent Prawny AI
                    </p>
                    <p className="text-slate-600 text-sm">
                      Pomoc w czasie rzeczywistym
                    </p>
                    <p className="text-blue-600 font-bold mt-1 flex items-center gap-1">
                      Uruchom czat <ExternalLink className="w-3 h-3" />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-600/5 p-8 rounded-2xl border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" /> Przydatne Linki
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-blue-700 hover:underline text-sm flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" /> Przewodnik po platformie
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-blue-700 hover:underline text-sm flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Wzory dokumentów
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-blue-700 hover:underline text-sm flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" /> Polityka Prywatności
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: FAQ & Contact Form */}
          <div className="lg:col-span-2 space-y-12">
            {/* Category Navigation */}
            {!searchQuery && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-12">
                {faqCategories.map((cat) => (
                  <button
                    key={cat.title}
                    onClick={() =>
                      setActiveCategory(
                        activeCategory === cat.title ? null : cat.title,
                      )
                    }
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                      activeCategory === cat.title
                        ? "bg-slate-900 border-slate-900 text-white shadow-lg scale-105"
                        : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`mb-2 ${activeCategory === cat.title ? "text-blue-400" : "text-slate-400"}`}
                    >
                      {getCategoryIcon(cat.title)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-center line-clamp-2">
                      {cat.title}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* FAQ Sections */}
            <div className="space-y-16">
              {displayedCategories.map((category) => (
                <section
                  key={category.title}
                  id={category.title.replace(/\s+/g, "-").toLowerCase()}
                >
                  <div className="flex items-center gap-3 mb-8 pb-2 border-b border-slate-200">
                    <div className="bg-slate-900 text-white p-2 rounded-lg">
                      {getCategoryIcon(category.title)}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {category.title}
                    </h2>
                    <span className="ml-auto text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                      {category.items.length} pytań
                    </span>
                  </div>

                  <div className="space-y-4">
                    {category.items.map((item, i) => {
                      const itemId = `${category.title}-${i}`;
                      const isOpen = openFaqId === itemId;
                      return (
                        <div
                          key={i}
                          className={`bg-white border transition-all duration-300 rounded-2xl overflow-hidden ${
                            isOpen
                              ? "border-blue-500 shadow-md ring-1 ring-blue-500/20"
                              : "border-slate-200 hover:border-slate-300 shadow-sm"
                          }`}
                        >
                          <button
                            onClick={() => setOpenFaqId(isOpen ? null : itemId)}
                            className="w-full text-left p-6 flex justify-between items-center bg-white transition-colors group"
                          >
                            <span
                              className={`font-bold transition-colors ${isOpen ? "text-blue-700" : "text-slate-800 group-hover:text-slate-900"}`}
                            >
                              {item.q}
                            </span>
                            <div
                              className={`p-1 rounded-full transition-all ${isOpen ? "bg-blue-100 text-blue-600 rotate-180" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"}`}
                            >
                              <ChevronDown className="w-5 h-5" />
                            </div>
                          </button>
                          <div
                            className={`transition-all duration-300 ease-in-out ${
                              isOpen
                                ? "max-h-[1000px] opacity-100"
                                : "max-h-0 opacity-0 overflow-hidden"
                            }`}
                          >
                            <div className="p-6 pt-0 text-slate-600 text-[15px] leading-relaxed">
                              <div className="h-px bg-slate-100 mb-6" />
                              <p className="whitespace-pre-line">{item.a}</p>
                              <div className="mt-6 flex items-center gap-4 py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-400">
                                  CZY TA ODPOWIEDŹ BYŁA POMOCNA?
                                </span>
                                <div className="flex gap-2">
                                  <button className="text-xs hover:text-blue-600 transition-colors font-bold px-2 py-1 rounded hover:bg-white">
                                    TAK
                                  </button>
                                  <button className="text-xs hover:text-red-600 transition-colors font-bold px-2 py-1 rounded hover:bg-white">
                                    NIE
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}

              {displayedCategories.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                  <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Brak wyników
                  </h3>
                  <p className="text-slate-600">
                    Nie znaleźliśmy odpowiedzi na Twoje zapytanie:{" "}
                    <span className="font-bold text-slate-900">
                      &quot;{searchQuery}&quot;
                    </span>
                    <br />
                    Spróbuj wpisać inne słowa kluczowe lub skorzystaj z
                    formularza poniżej.
                  </p>
                </div>
              )}
            </div>

            {/* Contact Form Section */}
            <section
              id="contact-form"
              className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-slate-200"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Wyślij zgłoszenie
              </h2>
              <p className="text-slate-600 mb-8">
                Nie znalazłeś odpowiedzi? Napisz do nas bezpośrednio – nasz
                zespół przeanalizuje Twój problem.
              </p>

              {submitted ? (
                <div className="bg-green-50 border border-green-200 p-8 rounded-xl text-center animate-in zoom-in-95">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Zgłoszenie wysłane!
                  </h3>
                  <p className="text-green-700">
                    Otrzymaliśmy Twoją wiadomość. Numer zgłoszenia: #LX-
                    {ticketNumber}. <br /> Odpowiemy tak szybko jak to możliwe.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-green-700 font-bold border-b border-green-700 hover:text-green-800 transition-colors"
                  >
                    Wyślij kolejne zgłoszenie
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="grid md:grid-cols-2 gap-6"
                >
                  <div className="md:col-span-1">
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-bold text-slate-600 uppercase mb-2"
                    >
                      Twoje Imię
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, name: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="np. Jan Kowalski"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-bold text-slate-600 uppercase mb-2"
                    >
                      Adres E-mail
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs font-bold text-slate-600 uppercase mb-2"
                    >
                      Temat
                    </label>
                    <select
                      id="contact-subject"
                      value={contactForm.subject}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          subject: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                    >
                      <option>Pomoc techniczna</option>
                      <option>Pytanie o sprawę</option>
                      <option>Rozliczenia i płatności</option>
                      <option>Sugestie i opinie</option>
                      <option>Inne</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-bold text-slate-600 uppercase mb-2"
                    >
                      Wiadomość
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          message: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none h-40 resize-none transition-all"
                      placeholder="Opisz dokładnie swój problem lub pytanie..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Wysyłanie...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" /> Wyślij wiadomość
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-600 mt-4 text-center">
                      Wysyłając zgłoszenie akceptujesz naszą Politykę
                      Prywatności oraz zasady przetwarzania danych osobowych.
                    </p>
                  </div>
                </form>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
