import React, { useState, useEffect, useRef } from "react";
import {
  Layout,
  Briefcase,
  Calendar,
  FileText,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  Bell,
  User,
  Clock,
  CheckCircle,
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Download,
  RefreshCcw,
  HelpCircle,
  Mail,
  Phone,
  Lock,
  X,
  Send,
  Save,
  ArrowRight,
  BellRing,
  ExternalLink,
  Edit,
  Trash2,
  Inbox,
  ShieldCheck,
  Paperclip,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import {
  casesApi,
  messagesApi,
  appointmentsApi,
  contactApi,
  usersApi,
  notificationsApi,
  auditApi,
  settingsApi,
  documentsApi,
  aiApi,
  type CaseDocument,
  type SecurityLog,
  type UserSettings,
} from "../services/api";
import { PaymentButton } from "../components/payments/PaymentButton";
import {
  formatLocalDate,
  getCurrentLocalDateString,
  isTodayOrFuture,
} from "../utils/dateUtils";
import { faqCategories } from "../utils/faqData";

const formatCurrency = (amount: number | string) => {
  const num =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[^\d.]/g, ""))
      : amount;
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(num);
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
};

// --- TYPES ---
interface Case {
  id: string;
  title: string;
  category: string;
  status:
  | "W toku"
  | "Zakończone"
  | "Oczekuje"
  | "W Sądzie"
  | "Opłacona/W analizie";
  progress: number;
  lastUpdate: string;
  description: string;
  documents?: CaseDocument[];
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  service: string;
  status: "Opłacona" | "Oczekuje";
  downloadUrl: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  type: "meeting" | "court" | "deadline";
  description?: string;
  time?: string;
  status?: "active" | "archived";
}

interface ChatMessage {
  id: number;
  sender: "user" | "lawyer";
  text: string;
  timestamp: string;
  archived?: boolean;
}

interface MailMessage {
  id: number | string;
  from: string;
  subject: string;
  date: string;
  read: boolean;
  content: string;
  archived?: boolean;
  sent?: boolean;
}

// --- MOCK DATA ---

const MOCK_INVOICES: Invoice[] = [
  {
    id: "FV/23/11/05",
    date: "2023-11-05",
    amount: "299.00 PLN",
    service: "Pozew o rozwód (Draft)",
    status: "Opłacona",
    downloadUrl: "#",
  },
  {
    id: "FV/23/10/22",
    date: "2023-10-22",
    amount: "89.00 PLN",
    service: "Konsultacja AI",
    status: "Opłacona",
    downloadUrl: "#",
  },
];

const MOCK_MAIL: MailMessage[] = [
  {
    id: 1,
    from: "Mec. Anna Nowak",
    subject: "Potwierdzenie wpływu dokumentów",
    date: "Dzisiaj, 10:15",
    read: false,
    content:
      "Dzień dobry, potwierdzam otrzymanie skanów dowodu osobistego. Przystępuję do weryfikacji.",
  },
  {
    id: 2,
    from: "Kancelaria LexPortal",
    subject: "Zaproszenie na spotkanie online",
    date: "Wczoraj, 14:00",
    read: true,
    content:
      "Zapraszamy na wideokonferencję w celu omówienia szczegółów pozwu.",
  },
];

// Helper to generate hours
const HOURS_24 = Array.from(
  { length: 24 },
  (_, i) => `${i.toString().padStart(2, "0")}:00`,
);

const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<
    | "dashboard"
    | "cases"
    | "calendar"
    | "payments"
    | "settings"
    | "help"
    | "chat"
    | "mail"
    | "ai_assistant"
  >("dashboard");
  const [cases, setCases] = useState<Case[]>([]);
  // const [isLoading, setIsLoading] = useState(true); // Removed unused
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);

  // New Case Form State
  const [newCaseData, setNewCaseData] = useState({
    title: "",
    category: "Inne",
    description: "",
  });

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      text: "Twoja sprawa LP/23/101 została zaktualizowana.",
      date: "2 godz. temu",
      unread: true,
    },
    {
      id: 2,
      text: "Nowa faktura została wystawiona.",
      date: "Wczoraj",
      unread: false,
    },
    {
      id: 3,
      text: "Mecenas Nowak przesłał wiadomość.",
      date: "Wczoraj",
      unread: true,
    },
  ]);

  // Selected Case for Preview
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [caseHistory, setCaseHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 2FA State
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState("");
  const [otpAuthUri, setOtpAuthUri] = useState("");
  const [twoFAVerifyCode, setTwoFAVerifyCode] = useState("");
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [twoFAMessage, setTwoFAMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleStart2FASetup = async () => {
    setIs2FALoading(true);
    setTwoFAMessage(null);
    try {
      const resp = await usersApi.setup2fa();
      setTwoFASecret(resp.secret);
      setOtpAuthUri(resp.otpauth_uri);
      setShow2FASetup(true);
    } catch (err) {
      setTwoFAMessage({
        text: "Błąd podczas generowania klucza 2FA.",
        type: "error",
      });
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    if (twoFAVerifyCode.length !== 6) return;
    setIs2FALoading(true);
    try {
      await usersApi.verify2fa(twoFAVerifyCode);
      setTwoFAMessage({ text: "2FA zostało pomyślnie włączone!", type: "success" });
      setShow2FASetup(false);
      // Update local user state if needed, or re-fetch
    } catch (err: any) {
      setTwoFAMessage({
        text: err.message || "Nieprawidłowy kod weryfikacyjny.",
        type: "error",
      });
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    const code = prompt("Aby wyłączyć 2FA, podaj aktualny kod z aplikacji:");
    if (!code) return;
    setIs2FALoading(true);
    try {
      await usersApi.disable2fa(code);
      setTwoFAMessage({ text: "2FA zostało wyłączone.", type: "success" });
    } catch (err: any) {
      setTwoFAMessage({
        text: err.message || "Błąd podczas wyłączania 2FA.",
        type: "error",
      });
    } finally {
      setIs2FALoading(false);
    }
  };

  const fetchCaseHistory = async (caseId: string) => {
    setIsLoadingHistory(true);
    try {
      const history = await casesApi.getHistory(caseId);
      setCaseHistory(history);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCaseClick = (c: Case) => {
    setSelectedCase(c);
    fetchCaseHistory(c.id);
  };

  // FAQ State (Moved from render function to fix Hook error)
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Calendar State (Upgraded to match Operator panel)
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">(
    "month",
  );
  const [showArchived, setShowArchived] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    getCurrentLocalDateString(),
  );
  const [newEvent, setNewEvent] = useState({
    title: "",
    time: "09:00",
    description: "",
  });
  const [editingEventId, setEditingEventId] = useState<number | string | null>(
    null,
  );

  // Appointment Modal State
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  // Profile State
  const [profileData, setProfileData] = useState({
    firstName: "Jan",
    lastName: "Kowalski",
    email: "jan.kowalski@example.com",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Password State
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passMessage, setPassMessage] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Mail State
  const [mail, setMail] = useState<MailMessage[]>(MOCK_MAIL);
  const [selectedMailId, setSelectedMailId] = useState<number | string | null>(
    null,
  );
  const [activeMailFilter, setActiveMailFilter] = useState<
    "inbox" | "sent" | "archived"
  >("inbox");

  const [showNewMailModal, setShowNewMailModal] = useState(false);
  const [newMailData, setNewMailData] = useState({
    to: "",
    subject: "",
    content: "",
  });

  // Security Logs State
  const [, setSecurityLogs] = useState<SecurityLog[]>([]);

  // Settings State
  const [userSettings, setUserSettings] = useState<UserSettings>({});

  // AI Assistant State
  const [aiAnalysisQuery, setAiAnalysisQuery] = useState("");
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Polling for Security Logs (every 5 seconds)
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const fetchLogs = async () => {
      try {
        const data = await auditApi.getLogs(1, 10);
        setSecurityLogs(data.items);
      } catch (error) {
        console.error("Failed to fetch security logs:", error);
      }
    };

    if (activeView === "settings") {
      fetchLogs(); // Initial fetch
      intervalId = setInterval(fetchLogs, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeView]);

  // Fetch Settings
  useEffect(() => {
    if (activeView === "settings" && !userSettings.theme) {
      settingsApi.getSettings().then(setUserSettings).catch(console.error);
    }
  }, [activeView, userSettings.theme]);

  const handleArchiveMail = async (id: number | string) => {
    try {
      await messagesApi.update(String(id), { is_archived: true });
      setMail(mail.map((m) => (m.id === id ? { ...m, archived: true } : m)));
      if (selectedMailId === id) setSelectedMailId(null);
    } catch (err) {
      console.error(err);
      alert("Błąd archiwizacji.");
    }
  };

  const handleRestoreMail = async (id: number | string) => {
    try {
      await messagesApi.update(String(id), { is_archived: false });
      setMail(mail.map((m) => (m.id === id ? { ...m, archived: false } : m)));
    } catch (err) {
      console.error(err);
      alert("Błąd przywracania.");
    }
  };

  const handleDeleteMail = (id: number | string) => {
    setMail(mail.filter((m) => m.id !== id));
    if (selectedMailId === id) setSelectedMailId(null);
  };

  const handleExportMailPDF = (message: MailMessage) => {
    alert(`Generowanie PDF dla wiadomości: ${message.subject}`);
  };

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMailData.content.trim() || !newMailData.to.trim()) return;

    try {
      // Dynamically fetch first available lawyer or admin as recipient
      const lawyers = await usersApi.listByRole("lawyer");
      const admins = await usersApi.listByRole("admin");
      const recipients = [...lawyers, ...admins];
      if (recipients.length === 0) {
        alert("Brak dostępnych prawników. Spróbuj ponownie później.");
        return;
      }
      await messagesApi.send({
        recipient_id: recipients[0].id,
        subject: newMailData.subject,
        content: newMailData.content,
      });

      setShowNewMailModal(false);
      setNewMailData({ to: "", subject: "", content: "" });
      setActiveMailFilter("sent");
      alert("Wiadomość została wysłana pomyślnie.");
    } catch (err) {
      console.error("An error occurred during message sending:", err);
      if (err instanceof Error) {
        console.error("Error message details:", err.message);
        console.error("Error stack trace:", err.stack);
      }
      alert("Błąd wysyłania wiadomości. Spróbuj ponownie później.");
    }
  };

  const handleReply = (message: MailMessage) => {
    setNewMailData({
      to: message.from,
      subject: `Re: ${message.subject}`,
      content: `\n\n--- Oryginalna wiadomość od ${message.from} ---\n${message.content}`,
    });
    setShowNewMailModal(true);
  };

  const handleAnalyzeCase = async () => {
    if (!aiAnalysisQuery.trim()) return;
    setIsAiLoading(true);
    setAiAnalysisResult(null);
    try {
      const response = await aiApi.analyzeCase(aiAnalysisQuery);
      setAiAnalysisResult(response);
      // Fetch notifications to show the one created by backend
      const notifData = await notificationsApi.list();
      setNotifications(
        notifData.map((n: any) => ({
          id: n.id,
          text: n.text,
          unread: !n.is_read,
          date: n.created_at ? formatDate(n.created_at) : "now",
        })),
      );
    } catch (err) {
      console.error("AI Analysis failed:", err);
      alert("Wystąpił błąd podczas analizy AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleForward = (message: MailMessage) => {
    setNewMailData({
      to: "",
      subject: `Fwd: ${message.subject}`,
      content: `\n\n--- Przekazana wiadomość od ${message.from} ---\n${message.content}`,
    });
    setShowNewMailModal(true);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    // Conflict Detection
    const hasConflict = events.some(
      (ev) =>
        ev.date === selectedDate &&
        ev.time === newEvent.time &&
        ev.id !== editingEventId &&
        ev.status !== "archived",
    );

    if (
      hasConflict &&
      !confirm(
        "Wykryto kolizję (inny termin o tej samej godzinie). Czy na pewno zapisać?",
      )
    ) {
      return;
    }

    try {
      if (editingEventId !== null) {
        // Update existing event
        await appointmentsApi.update(String(editingEventId), {
          title: newEvent.title,
          date: selectedDate,
          time: newEvent.time,
          description: newEvent.description,
        });
        setEvents(
          events.map((ev) =>
            ev.id === editingEventId
              ? {
                ...ev,
                title: newEvent.title,
                date: selectedDate,
                time: newEvent.time,
                description: newEvent.description,
              }
              : ev,
          ),
        );
        setEditingEventId(null);
      } else {
        // Create new event
        const created = (await appointmentsApi.create({
          title: newEvent.title,
          date: selectedDate,
          time: newEvent.time,
          type: "meeting",
          description: newEvent.description,
        })) as any;
        setEvents([...events, { ...created, id: created.id }]);
      }
      setShowAppointmentModal(false);
      setNewEvent({ title: "", time: "09:00", description: "" });
    } catch (err) {
      console.error(err);
      alert("Błąd zapisu terminu.");
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setNewEvent({
      title: event.title,
      time: event.time || "09:00",
      description: event.description || "",
    });
    setSelectedDate(event.date);
    setShowAppointmentModal(true);
  };

  const handleDeleteEvent = async (id: number | string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten termin?")) return;
    try {
      await appointmentsApi.delete(String(id));
      setEvents(events.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
      alert("Błąd usuwania terminu.");
    }
  };

  const handleArchiveEvent = async (id: number | string) => {
    try {
      await appointmentsApi.update(String(id), {
        status: "archived",
      });
      setEvents(
        events.map((e) => (e.id === id ? { ...e, status: "archived" } : e)),
      );
    } catch (err) {
      console.error(err);
      alert("Błąd archiwizacji terminu.");
    }
  };

  // --- CONTACT FORM STATE ---
  const [contactForm, setContactForm] = useState({
    subject: "Błąd techniczny",
    message: "",
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await contactApi.send({
        subject: contactForm.subject,
        message: contactForm.message,
      });
      alert(
        `Wysłano zgłoszenie:\nTemat: ${contactForm.subject}\nTreść: ${contactForm.message}`,
      );
      setContactForm({ subject: "Błąd techniczny", message: "" });
    } catch (err) {
      console.error(err);
      alert("Błąd wysyłania zgłoszenia.");
    }
  };

  // --- HISTORY MODAL STATE ---
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Cases
      try {
        const casesData = await casesApi.list();
        setCases(casesData as any);
      } catch (error) {
        console.error("Failed to fetch cases:", error);
      }

      // Fetch Notifications
      try {
        const notifs = await notificationsApi.list();
        if (Array.isArray(notifs) && notifs.length > 0) {
          const mappedNotifs = notifs.map(
            (n: any) => ({
              id: n.id,
              text: n.message || n.text || "Powiadomienie",
              date: n.created_at
                ? new Date(n.created_at).toLocaleDateString()
                : "Dzisiaj",
              unread: !(n.is_read ?? n.read),
            }),
          );
          setNotifications(mappedNotifs);
        }
      } catch (error) {
        console.warn("Failed to fetch notifications:", error);
      }

      // Fetch Appointments (Events)
      try {
        const appointments = await appointmentsApi.list();
        if (Array.isArray(appointments)) {
          setEvents(
            appointments.map(
              (a: any) => ({
                id: a.id,
                title: a.title,
                date: a.date,
                time: a.time,
                type:
                  a.type === "online"
                    ? "meeting"
                    : a.type === "court"
                      ? "court"
                      : "meeting",
                description: a.description,
                status:
                  a.status === "archived" || a.status === "active"
                    ? a.status
                    : undefined,
              }),
            ),
          );
        }
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      }

      // Fetch Messages (Mail)
      try {
        const msgs = await messagesApi.list(true); // include archived for mail view filtering
        if (Array.isArray(msgs)) {
          setMail(
            msgs.map(
              (m: any) => ({
                id: m.id,
                from: m.sender_id === user?.id ? "Ja" : "Prawnik / System",
                subject: m.subject || "Bez tematu",
                date: new Date(m.created_at).toLocaleString("pl-PL"),
                read: m.is_read,
                content: m.content,
                archived: m.is_archived ?? m.archived,
                sent: m.sender_id === user?.id,
              }),
            ),
          );
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchData();
  }, [activeView, user?.id]);

  // Handlers
  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(notifications.map((n) => ({ ...n, unread: false })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleExportPDF = (caseData: Case & { amount?: string }) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
          <html>
            <head>
              <title>Eksport: ${caseData.category === "Płatności" ? "Faktura" : "Sprawa"}-${caseData.id}</title>
              <style>
                body { font-family: sans-serif; padding: 40px; }
                header { border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 30px; }
                h1 { color: #1e293b; margin: 0; }
                .meta { color: #64748b; font-size: 0.9em; margin-top: 5px; }
                .content { line-height: 1.6; }
                .label { font-weight: bold; color: #475569; width: 150px; display: inline-block; }
                .value { color: #0f172a; }
                .footer { margin-top: 60px; font-size: 0.8em; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; }
              </style>
            </head>
            <body>
              <header>
                <h1>LexPortal Raport</h1>
                <div class="meta">Data wygenerowania: ${new Date().toLocaleDateString()}</div>
              </header>
              <div class="content">
                <h2>${caseData.category === "Płatności" ? "Szczegóły Faktury" : "Szczegóły Sprawy"}</h2>
                
                <div style="margin-bottom: 10px;">
                  <span class="label">ID:</span>
                  <span class="value">${caseData.id}</span>
                </div>
                
                <div style="margin-bottom: 10px;">
                  <span class="label">Kategoria:</span>
                  <span class="value">${caseData.category}</span>
                </div>

                <div style="margin-bottom: 10px;">
                  <span class="label">Status:</span>
                  <span class="value">${caseData.status}</span>
                </div>

                <div style="margin-bottom: 10px;">
                  <span class="label">Ostatnia zmiana:</span>
                  <span class="value">${caseData.lastUpdate}</span>
                </div>

                ${caseData.amount
          ? `
                <div style="margin-bottom: 10px;">
                  <span class="label">Kwota:</span>
                  <span class="value">${caseData.amount}</span>
                </div>
                `
          : ""
        }

                <div style="margin-top: 20px;">
                  <span class="label">Opis:</span>
                  <div class="value" style="margin-top: 5px; background: #f8fafc; padding: 10px; border-radius: 6px;">
                    ${caseData.description || caseData.title || "Brak dodatkowego opisu."}
                  </div>
                </div>

              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} Kancelaria Prawna LexPortal. Dokument wygenerowany automatycznie.
              </div>
            </body>
          </html>
        `);
      printWindow.document.close();
      printWindow.print();
    } else {
      alert("Proszę odblokować wyskakujące okienka (pop-ups), aby pobrać PDF.");
    }
  };

  const handleGoogleSync = () => {
    window.open("https://calendar.google.com", "_blank");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await usersApi.updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        address: "Zaktualizowany Adres", // TODO: Add address field to UI
        pesel: "00000000000", // TODO: Add pesel field to UI
      });
      setSaveMessage("Zmiany zostały zapisane pomyślnie.");
    } catch (err: unknown) {
      setSaveMessage(
        "Błąd zapisu: " +
        (err instanceof Error ? err.message : "Nieznany błąd"),
      );
    } finally {
      setIsSavingProfile(false);
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      setPassMessage("Hasła nie są identyczne.");
      return;
    }
    setIsChangingPass(true);
    try {
      await usersApi.changePassword({
        current_password: passwordData.current,
        new_password: passwordData.new,
      });
      setPassMessage("Hasło zostało zmienione.");
      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (err: unknown) {
      setPassMessage(
        "Błąd: " + (err instanceof Error ? err.message : "Nieznany błąd"),
      );
    } finally {
      setIsChangingPass(false);
      setTimeout(() => setPassMessage(""), 3000);
    }
  };

  // --- RENDERERS ---

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in font-sans">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">
            Dzień dobry, {user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Kliencie"}!
          </h2>
          <p className="text-blue-100 max-w-xl">
            {cases.filter((c) => c.status !== "Zakończone").length > 0
              ? `Masz ${cases.filter((c) => c.status !== "Zakończone").length} aktywn${cases.filter((c) => c.status !== "Zakończone").length === 1 ? "ą sprawę" : "e sprawy"} wymagające Twojej uwagi.`
              : "Wszystkie Twoje sprawy są aktualne. Sprawdź najnowsze powiadomienia."}
          </p>
          <button
            onClick={() => setActiveView("cases")}
            className="mt-6 bg-white text-blue-700 px-6 py-2.5 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-md"
          >
            Przejdź do spraw
          </button>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10">
          <Briefcase className="w-64 h-64 -mb-12 -mr-12 transform -rotate-12" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all hover:border-blue-200">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest group-hover:text-blue-600 transition-colors">
              Otwarte Sprawy
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
              {cases.filter((c) => c.status !== "Zakończone").length}
            </h3>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-6">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all hover:border-orange-200">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest group-hover:text-orange-600 transition-colors">
              Najbliższy Termin
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
              {events.length > 0 ? events[0].time : "Brak"}
            </h3>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all transform group-hover:rotate-6">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all hover:border-green-200">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest group-hover:text-green-600 transition-colors">
              Płatności (Salda)
            </p>
            <h3 className="text-3xl font-extrabold text-green-600 mt-2">
              {(() => {
                const pending = cases.filter(
                  (c) =>
                    c.status !== "Zakończone" &&
                    c.status !== "Opłacona/W analizie",
                ).length;
                return pending > 0
                  ? `${pending} do opłacenia`
                  : formatCurrency(0);
              })()}
            </h3>
          </div>
          <div className="bg-green-50 p-4 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all transform group-hover:rotate-6">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recommended Services / Marketplace Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layout className="w-5 h-5 text-blue-500" /> Polecane Usługi
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "Analiza Umowy",
                price: 199,
                icon: <FileText className="w-8 h-8 text-blue-500" />,
              },
              {
                title: "Konsultacja AI",
                price: 49,
                icon: <RefreshCcw className="w-8 h-8 text-purple-500" />,
              },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all group cursor-pointer"
              >
                <div className="mb-4 bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  {s.icon}
                </div>
                <h4 className="font-bold text-slate-900 mb-1">{s.title}</h4>
                <p className="text-sm text-slate-500 mb-4">
                  Pełna ekspertyza prawna online.
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-extrabold text-blue-600">
                    {formatCurrency(s.price)}
                  </span>
                  <button
                    onClick={() => setActiveView("payments")}
                    className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-600 transition-colors"
                  >
                    Kup Teraz
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity — driven by real cases data */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-lg">
            Ostatnia Aktywność
          </h3>
          <button
            onClick={() => setActiveView("cases")}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Zobacz wszystko
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {cases.length > 0 ? (
            cases.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => { setSelectedCase(c); setActiveView("cases"); }}
              >
                <div className={`p-2 rounded-full ${c.status === "Zakończone"
                  ? "bg-green-100 text-green-600"
                  : c.status === "W toku"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-orange-100 text-orange-600"
                  } `}>
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.title}</p>
                  <p className="text-xs text-slate-500">
                    Status: {c.status} &bull; {c.lastUpdate || "—"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400">
              <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Brak aktywności do wyświetlenia</p>
              <button
                onClick={() => setShowNewCaseModal(true)}
                className="mt-3 text-blue-600 text-sm font-medium hover:underline"
              >Dodaj pierwszą sprawę →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCases = () => (
    <div className="space-y-6 animate-in fade-in font-sans">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-900">Moje Sprawy</h2>
        <button
          onClick={() => setShowNewCaseModal(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" /> Nowa Sprawa
        </button>
      </div>

      <div className="grid gap-4">
        {cases.map((c) => (
          <div
            key={c.id}
            onClick={() => handleCaseClick(c)}
            className="group block p-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden text-left"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold tracking-tighter">
                    {c.id}
                  </span>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                    {c.title}
                  </h3>
                </div>
                <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                  {c.category}
                </p>
              </div>
              <span
                className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest shadow-sm
                              ${c.status === "W toku"
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : c.status === "W Sądzie"
                      ? "bg-purple-50 text-purple-700 border border-purple-100"
                      : c.status === "Zakończone"
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : "bg-slate-50 text-slate-600 border border-slate-200"
                  } `}
              >
                {c.status}
              </span>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {c.description}
            </p>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
              <div className="flex-1 mr-8">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                  <span>Postęp realizacji</span>
                  <span className="text-slate-900">{c.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${c.progress}% ` }}
                  ></div>
                </div>
              </div>
              <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5" /> {c.lastUpdate}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCalendar = () => {
    // Helper to get events for a date
    const getEventsForDate = (dateStr: string) => {
      // Use state instead of mock constant
      return events.filter((e) => e.date === dateStr);
    };

    // Helper to render Day/Week timeline cells
    const renderTimelineCell = (hour: string, dateStr?: string) => {
      const actualDateStr = dateStr || formatLocalDate(calendarDate);
      const hourPrefix = hour.split(":")[0];
      const hourEvents = getEventsForDate(actualDateStr).filter(
        (e) => e.time?.startsWith(hourPrefix) && e.status !== "archived",
      );

      return (
        <div
          key={hour}
          onClick={() => {
            setSelectedDate(actualDateStr);
            setNewEvent({ ...newEvent, time: hour });
            setShowAppointmentModal(true);
          }}
          className="h-20 border-b border-slate-100 relative hover:bg-slate-50 transition-colors group cursor-pointer"
        >
          <span className="absolute left-2 top-2 text-[10px] text-slate-400 group-hover:text-slate-600 select-none">
            {hour}
          </span>
          <div className="ml-14 h-full py-1 pr-2 space-y-1">
            {hourEvents.map((ev, i) => (
              <div
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditEvent(ev);
                }}
                className={`text-[9px] p-1.5 rounded border-l-4 truncate cursor-pointer hover: opacity-80 transition-opacity shadow-sm ${ev.type === "court" ? "bg-red-50 border-red-500 text-red-800" : "bg-blue-50 border-blue-500 text-blue-800"} `}
              >
                {ev.title}
              </div>
            ))}
          </div>
        </div>
      );
    };

    // Calendar Logic-State and Handlers moved to top level

    return (
      <>
        <div className="space-y-6 animate-in fade-in font-sans">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Terminarz</h2>
            <div className="flex gap-2">
              <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                <button
                  onClick={() => setCalendarView("month")}
                  className={`px-4 py-1.5 text-xs font-bold rounded ${calendarView === "month" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"} `}
                >
                  Miesiąc
                </button>
                <button
                  onClick={() => setCalendarView("week")}
                  className={`px-4 py-1.5 text-xs font-bold rounded ${calendarView === "week" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"} `}
                >
                  Tydzień
                </button>
                <button
                  onClick={() => setCalendarView("day")}
                  className={`px-4 py-1.5 text-xs font-bold rounded ${calendarView === "day" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"} `}
                >
                  Dzień
                </button>
              </div>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1.5 ${showArchived ? "bg-amber-100 border-amber-200 text-amber-700 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"} `}
              >
                <Inbox className="w-3.5 h-3.5" />
                {showArchived ? "Ukryj archiwum" : "Archiwum"}
              </button>
              <button
                onClick={() => setShowAppointmentModal(true)}
                className="bg-slate-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold hover:bg-slate-800 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Dodaj
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-900">
                  {calendarDate.toLocaleDateString("pl-PL", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const d = new Date(calendarDate);
                      if (calendarView === "month")
                        d.setMonth(d.getMonth() - 1);
                      else if (calendarView === "week")
                        d.setDate(d.getDate() - 7);
                      else d.setDate(d.getDate() - 1);
                      setCalendarDate(d);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <button
                    onClick={() => setCalendarDate(new Date())}
                    className="px-4 py-2 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold text-slate-600"
                  >
                    Dzisiaj
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date(calendarDate);
                      if (calendarView === "month")
                        d.setMonth(d.getMonth() + 1);
                      else if (calendarView === "week")
                        d.setDate(d.getDate() + 7);
                      else d.setDate(d.getDate() + 1);
                      setCalendarDate(d);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>

              {calendarView === "month" && (
                <div className="flex-1">
                  <div className="grid grid-cols-7 gap-2 text-center text-[10px] mb-2 text-slate-400 font-bold uppercase tracking-wider">
                    <div>Pon</div>
                    <div>Wt</div>
                    <div>Śr</div>
                    <div>Czw</div>
                    <div>Pt</div>
                    <div>Sob</div>
                    <div>Nd</div>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 42 }).map((_, i) => {
                      const date = new Date(
                        calendarDate.getFullYear(),
                        calendarDate.getMonth(),
                        1,
                      );
                      const startDay = (date.getDay() + 6) % 7;
                      date.setDate(i - startDay + 1);

                      const dateStr = formatLocalDate(date);
                      const dayEvents = getEventsForDate(dateStr);
                      const isToday = dateStr === getCurrentLocalDateString();

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            setSelectedDate(dateStr);
                            setShowAppointmentModal(true);
                          }}
                          className={`min-h-[100px] border rounded-xl p-2 flex flex-col justify-between hover: bg-slate-50 transition-all group cursor-pointer ${date.getMonth() === calendarDate.getMonth() ? (isToday ? "bg-blue-50 border-blue-200" : "bg-white border-slate-100 shadow-sm") : "bg-slate-50 border-transparent opacity-40"} `}
                        >
                          <span
                            className={`text-xs font-bold ${isToday ? "text-blue-600" : "text-slate-700"} `}
                          >
                            {date.getDate()}
                          </span>
                          <div className="space-y-1 mt-1 flex-1">
                            {dayEvents
                              .filter(
                                (e) => showArchived || e.status !== "archived",
                              )
                              .map((event, idx) => (
                                <div
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditEvent(event);
                                  }}
                                  className={`text-[9px] p-1.5 rounded-lg border cursor-pointer hover: scale-[1.02] active: scale-95 transition-all truncate font-bold ${event.status === "archived" ? "bg-slate-100 text-slate-400 border-slate-200 italic" : event.type === "court" ? "bg-red-50 text-red-700 border-red-100" : "bg-blue-50 text-blue-700 border-blue-100"} `}
                                >
                                  {event.time} {event.title}
                                  {event.status === "archived" && " (Archiwum)"}
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(calendarView === "week" || calendarView === "day") && (
                <div className="flex-1 overflow-y-auto max-h-[600px] border rounded-xl border-slate-100">
                  {calendarView === "week" ? (
                    <div className="flex flex-col min-w-[800px]">
                      <div className="grid grid-cols-8 border-b border-slate-200 sticky top-0 bg-white z-20">
                        <div className="p-2 text-[10px] text-slate-400 text-center pt-8">
                          GMT+1
                        </div>
                        {Array.from({ length: 7 }).map((_, i) => {
                          const date = new Date(calendarDate);
                          const day = date.getDay() || 7;
                          if (day !== 1)
                            date.setDate(date.getDate() - (day - 1));
                          date.setDate(date.getDate() + i);
                          const isToday =
                            formatLocalDate(date) ===
                            getCurrentLocalDateString();
                          return (
                            <div
                              key={i}
                              className={`p-2 text-center border-l border-slate-100 ${isToday ? "bg-blue-50" : ""} `}
                            >
                              <div className="text-[10px] text-slate-500 uppercase font-bold">
                                {
                                  ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"][
                                  i
                                  ]
                                }
                              </div>
                              <div
                                className={`text-lg font-bold ${isToday ? "text-blue-600" : "text-slate-800"} `}
                              >
                                {date.getDate()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="grid grid-cols-8">
                        <div className="border-r border-slate-100">
                          {HOURS_24.filter((_, i) => i >= 8 && i <= 20).map(
                            (h) => (
                              <div
                                key={h}
                                className="h-20 text-[10px] text-slate-400 text-center pt-2 border-b border-slate-50"
                              >
                                {h}
                              </div>
                            ),
                          )}
                        </div>
                        {Array.from({ length: 7 }).map((_, i) => {
                          const date = new Date(calendarDate);
                          const day = date.getDay() || 7;
                          if (day !== 1)
                            date.setDate(date.getDate() - (day - 1));
                          date.setDate(date.getDate() + i);
                          return (
                            <div key={i} className="border-r border-slate-100">
                              {HOURS_24.filter(
                                (_, idx) => idx >= 8 && idx <= 20,
                              ).map((h) =>
                                renderTimelineCell(
                                  h,
                                  date.toISOString().slice(0, 10),
                                ),
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="p-4 bg-blue-50 border-b border-blue-100 text-center sticky top-0 z-20">
                        <h3 className="text-lg font-bold text-blue-900">
                          {calendarDate.toLocaleDateString("pl-PL", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </h3>
                      </div>
                      <div className="relative">
                        {HOURS_24.filter((_, i) => i >= 8 && i <= 20).map((h) =>
                          renderTimelineCell(h),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-orange-500" /> Nadchodzące
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {events
                    .filter(
                      (e) => e.status !== "archived" && isTodayOrFuture(e.date),
                    )
                    .sort(
                      (a, b) =>
                        a.date.localeCompare(b.date) ||
                        (a.time || "").localeCompare(b.time || ""),
                    )
                    .map((event) => (
                      <div
                        key={event.id}
                        className="flex gap-3 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0 group hover:bg-slate-50 p-2 rounded-lg transition-colors"
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${event.type === "court" ? "bg-red-500" : "bg-blue-500"} `}
                        ></div>
                        <div className="flex-1">
                          <p className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors">
                            {event.title}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {event.date} • {event.time || "09:00"}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="p-1 px-2 hover:bg-blue-100 rounded-md text-slate-400 hover:text-blue-600 transition-colors"
                            title="Edytuj"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchiveEvent(event.id)}
                            className="p-1 px-2 hover:bg-amber-100 rounded-md text-slate-400 hover:text-amber-600 transition-colors"
                            title="Archiwizuj"
                          >
                            <Inbox className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-1 px-2 hover:bg-red-100 rounded-md text-slate-400 hover:text-red-600 transition-colors"
                            title="Usuń na stałe"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  {events.filter(
                    (e) => e.status !== "archived" && isTodayOrFuture(e.date),
                  ).length === 0 && (
                      <div className="py-8 text-center">
                        <p className="text-xs text-slate-400 italic">
                          Brak nadchodzących terminów.
                        </p>
                      </div>
                    )}
                </div>
                <button
                  onClick={handleGoogleSync}
                  className="w-full mt-6 bg-slate-900 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-900/10"
                >
                  <ExternalLink className="w-3 h-3" /> Synchronizuj z Google
                </button>
              </div>

              <div className="bg-linear-to-br from-indigo-600 to-blue-700 p-6 rounded-xl text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10">
                  <h4 className="font-bold text-sm mb-2">
                    Potrzebujesz spotkania?
                  </h4>
                  <p className="text-[10px] text-indigo-100 mb-4">
                    Umów się na konsultację online lub w biurze.
                  </p>
                  <button
                    onClick={() => setShowAppointmentModal(true)}
                    className="w-full bg-white text-indigo-700 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors"
                  >
                    Umów konsultację
                  </button>
                </div>
                <Calendar className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 transform -rotate-12" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderPayments = () => {
    // Cena usługi na podstawie kategorii sprawy
    const getAmount = (category: string): string => {
      if (["Windykacja", "Prawo Pracy"].includes(category)) return "299.00";
      if (category === "Nieruchomości") return "499.00";
      return "199.00";
    };

    const unpaidCases = cases.filter(
      (c) => c.status !== "Zakończone" && c.status !== "Opłacona/W analizie",
    );

    return (
      <div className="space-y-8 animate-in fade-in font-sans">
        <h2 className="text-2xl font-bold text-slate-900">
          Płatności i Faktury
        </h2>

        {/* Sekcja 1: Sprawy wymagające opłaty */}
        {unpaidCases.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-500" />
              Sprawy wymagające opłaty
            </h3>
            <div className="grid gap-4">
              {unpaidCases.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold tracking-tighter">
                        {c.id}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {c.title}
                      </h4>
                    </div>
                    <p className="text-xs text-blue-500 font-bold uppercase tracking-widest">
                      {c.category}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {c.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <p className="text-xl font-extrabold text-slate-900">
                      {formatCurrency(getAmount(c.category))}
                    </p>
                    <PaymentButton
                      caseId={c.id}
                      amount={getAmount(c.category)}
                      onError={(msg) => alert(`Błąd płatności: ${msg} `)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {unpaidCases.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
            <div>
              <p className="font-bold text-green-800">
                Wszystkie sprawy opłacone
              </p>
              <p className="text-sm text-green-700">
                Brak oczekujących płatności. Dziękujemy!
              </p>
            </div>
          </div>
        )}

        {/* Sekcja 2: Historia transakcji */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            Historia Transakcji
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Numer Faktury</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Usługa</th>
                  <th className="px-6 py-4">Kwota</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Akcja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_INVOICES.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-5 font-mono font-bold text-slate-900">
                      {inv.id}
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium">
                      {formatDate(inv.date)}
                    </td>
                    <td className="px-6 py-5 text-slate-900 font-semibold">
                      {inv.service}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-lg font-extrabold text-slate-900">
                        {formatCurrency(inv.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border ${inv.status === "Opłacona"
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-amber-50 text-amber-700 border-amber-100"
                          } `}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() =>
                          handleExportPDF({
                            id: inv.id,
                            title: `Faktura ${inv.id} `,
                            status:
                              inv.status === "Oczekuje"
                                ? "Oczekuje"
                                : "Zakończone",
                            category: "Płatności",
                            lastUpdate: inv.date,
                            progress: 100,
                            description: `Faktura za usługę: ${inv.service} `,
                          })
                        }
                        className="bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white px-4 py-2 rounded-lg transition-all font-bold uppercase text-[10px] border border-slate-200 flex items-center gap-2 ml-auto shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {MOCK_INVOICES.length === 0 && (
              <div className="py-12 text-center">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm italic">
                  Brak historii transakcji.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="max-w-4xl animate-in fade-in font-sans">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        Ustawienia Konta
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Data */}
        <form
          onSubmit={handleSaveProfile}
          className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6"
        >
          <div>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> Dane Profilowe
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-bold text-slate-500 uppercase mb-1"
                >
                  Imię
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      firstName: e.target.value,
                    })
                  }
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Nazwisko
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, lastName: e.target.value })
                  }
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {saveMessage && (
            <div className="p-3 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100 flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4" /> {saveMessage}
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSavingProfile ? (
                <RefreshCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSavingProfile ? "Zapisywanie..." : "Zapisz Zmiany"}
            </button>
          </div>
        </form>

        {/* Notifications & Security */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BellRing className="w-5 h-5" /> Powiadomienia
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Powiadomienia Email
                  </p>
                  <p className="text-xs text-slate-500">
                    Otrzymuj aktualizacje o statusie spraw.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Powiadomienia SMS
                  </p>
                  <p className="text-xs text-slate-500">
                    Alerty o pilnych terminach (płatne).
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Newsletter
                  </p>
                  <p className="text-xs text-slate-500">
                    Informacje o zmianach w prawie.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" /> Bezpieczeństwo
            </h3>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Obecne hasło"
                value={passwordData.current}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, current: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <input
                type="password"
                placeholder="Nowe hasło"
                value={passwordData.new}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, new: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <input
                type="password"
                placeholder="Powtórz nowe hasło"
                value={passwordData.confirm}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirm: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
              {passMessage && (
                <div
                  className={`p-2 rounded text-xs font-bold ${passMessage.includes("Błąd") || passMessage.includes("nie") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"} `}
                >
                  {passMessage}
                </div>
              )}
              <button
                onClick={handleChangePassword}
                disabled={isChangingPass}
                className="w-full border border-slate-300 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 mt-2 disabled:opacity-50"
              >
                {isChangingPass ? "Zmienianie..." : "Zmień Hasło"}
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" /> Weryfikacja
              Dwuetapowa (2FA)
            </h3>
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Dodaj dodatkową warstwę bezpieczeństwa do swojego konta. Po
                zalogowaniu będziesz musiał podać kod z aplikacji
                uwierzytelniającej.
              </p>

              {user?.is_2fa_enabled ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                    <CheckCircle className="w-4 h-4" /> 2FA jest AKTYWNE
                  </div>
                  <button
                    onClick={handleDisable2FA}
                    disabled={is2FALoading}
                    className="w-full border border-red-200 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Wyłącz 2FA
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStart2FASetup}
                  disabled={is2FALoading || show2FASetup}
                  className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  {is2FALoading ? (
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  Skonfiguruj 2FA
                </button>
              )}

              {twoFAMessage && (
                <div
                  className={`p-3 rounded-lg text-xs font-bold border ${twoFAMessage.type === "success"
                    ? "bg-green-50 text-green-700 border-green-100"
                    : "bg-red-50 text-red-700 border-red-100"
                    } `}
                >
                  {twoFAMessage.text}
                </div>
              )}

              {show2FASetup && (
                <div className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-6 animate-in slide-in-from-top-4 duration-300">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-bold text-slate-800">
                      Zeskanuj kod QR
                    </p>
                    <p className="text-xs text-slate-500">
                      Użyj aplikacji Google Authenticator lub Authy.
                    </p>
                  </div>

                  <div className="flex justify-center bg-white p-4 rounded-lg shadow-inner border border-slate-100">
                    <QRCodeSVG
                      value={otpAuthUri}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Kod weryfikacyjny
                      </label>
                      <input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={twoFAVerifyCode}
                        onChange={(e) => setTwoFAVerifyCode(e.target.value)}
                        className="w-full text-center text-xl font-mono tracking-[0.5em] border border-slate-300 rounded-lg px-3 py-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShow2FASetup(false)}
                        className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-100"
                      >
                        Anuluj
                      </button>
                      <button
                        onClick={handleConfirm2FA}
                        disabled={is2FALoading || twoFAVerifyCode.length !== 6}
                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-100"
                      >
                        {is2FALoading ? "Weryfikacja..." : "Potwierdź"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-[10px] text-slate-400 text-center">
                      Twój tajny klucz: <span className="font-mono">{twoFASecret}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHelp = () => {
    return (
      <div className="space-y-12 animate-in fade-in max-w-7xl mx-auto font-sans p-6 pb-24">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="bg-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-200 mb-4">
            <HelpCircle className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Centrum Pomocy LexPortal
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Wszystko, czego potrzebujesz, aby efektywnie korzystać z platformy i
            rozumieć swoje sprawy.
          </p>

          {/* Quick Search */}
          <div className="relative max-w-xl mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Wyszukaj szybko pomocną informację..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/50 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* FAQ Column-Now taking more space */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1.5 bg-blue-600 rounded-full"></div>
              <h3 className="font-bold text-2xl text-slate-900">Baza Wiedzy</h3>
            </div>

            <div className="space-y-12">
              {faqCategories.map((category, catIdx) => (
                <div key={catIdx} className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest bg-blue-50 w-fit px-3 py-1 rounded-lg">
                    {category.title}
                  </h4>
                  <div className="grid gap-3">
                    {category.items.slice(0, 5).map((faq, idx) => {
                      const isOpen = openFaq === catIdx * 100 + idx;
                      return (
                        <div
                          key={idx}
                          className={`bg-white rounded-2xl border transition-all duration-300 ${isOpen ? "border-blue-500 shadow-xl ring-1 ring-blue-500/10" : "border-slate-200 hover:border-slate-300 shadow-sm"} `}
                        >
                          <button
                            onClick={() =>
                              setOpenFaq(isOpen ? null : catIdx * 100 + idx)
                            }
                            className="w-full flex justify-between items-center p-5 text-left group"
                          >
                            <span
                              className={`font-bold text-[15px] transition-colors ${isOpen ? "text-blue-700" : "text-slate-700 group-hover:text-slate-900"} `}
                            >
                              {faq.q}
                            </span>
                            <div
                              className={`p-1 rounded-full transition-all ${isOpen ? "bg-blue-100 text-blue-600 rotate-180" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"} `}
                            >
                              <ChevronDown className="w-5 h-5" />
                            </div>
                          </button>
                          {isOpen && (
                            <div className="p-6 pt-0 text-[15px] text-slate-600 leading-relaxed border-t border-slate-50 animate-in slide-in-from-top-2">
                              <div className="py-4">{faq.a}</div>
                              <div className="mt-4 flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-50 pt-4">
                                <span>CZY TO POMOGŁO?</span>
                                <button className="hover:text-blue-600 uppercase">
                                  Tak
                                </button>
                                <button className="hover:text-red-600 uppercase">
                                  Nie
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="relative z-10">
                <h4 className="text-2xl font-bold mb-2">
                  Potrzebujesz więcej pomocy?
                </h4>
                <p className="text-slate-400 max-w-md">
                  Nasza pełna baza wiedzy zawiera ponad 200 artykułów i wzorów
                  dokumentów.
                </p>
              </div>
              <button
                onClick={() => navigate("/help")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30 whitespace-nowrap relative z-10"
              >
                Pełne Centrum Pomocy
              </button>
              <HelpCircle className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5" />
            </div>
          </div>

          {/* Contact Column */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1.5 bg-indigo-600 rounded-full"></div>
              <h3 className="font-bold text-2xl text-slate-900">
                Kontakt Express
              </h3>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-500 transition-all cursor-pointer">
                <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all mb-4">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">
                  Czat z Operatorem
                </h4>
                <p className="text-sm text-slate-500">
                  Średni czas odpowiedzi: 5 minut
                </p>
                <button
                  onClick={() => setActiveView("chat")}
                  className="mt-4 text-sm font-bold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all"
                >
                  Otwórz czat <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-indigo-500 transition-all cursor-pointer">
                <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">
                  Poczta Wewnętrzna
                </h4>
                <p className="text-sm text-slate-500">
                  Dla oficjalnej korespondencji
                </p>
                <button
                  onClick={() => setActiveView("mail")}
                  className="mt-4 text-sm font-bold text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all"
                >
                  Wyślij wiadomość <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Support Form */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-slate-600" /> Zgłoś problem
                techniczny
              </h3>
              <form className="space-y-4" onSubmit={handleContactSubmit}>
                <div>
                  <label
                    htmlFor="support-subject"
                    className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider ml-1"
                  >
                    Temat zgłoszenia
                  </label>
                  <select
                    id="support-subject"
                    value={contactForm.subject}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        subject: e.target.value,
                      })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white font-medium text-slate-700 transition-all"
                  >
                    <option>Błąd działania systemu</option>
                    <option>Problem z płatnością</option>
                    <option>Pytanie o ofertę</option>
                    <option>Inne uwagi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider ml-1">
                    Treść wiadomości
                  </label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        message: e.target.value,
                      })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-40 resize-none transition-all placeholder:text-slate-400"
                    placeholder="Opisz w kilku słowach, w czym możemy pomóc..."
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 active:scale-95"
                >
                  <Send className="w-5 h-5" /> Wyślij Formularz
                </button>
              </form>
            </div>

            {/* Infolinia */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                <Phone className="w-7 h-7 text-slate-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">
                  Wsparcie telefoniczne
                </p>
                <p className="text-xl font-bold text-slate-900">
                  +48 22 123 45 67
                </p>
                <p className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>{" "}
                  TERAZ DOSTĘPNE
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAIAssistant = () => {
    return (
      <div className="space-y-8 animate-in fade-in font-sans">
        <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden border border-blue-500/20">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-4">
              <Zap className="text-yellow-400 w-8 h-8 animate-pulse" />
              Asystent Prawny Lexportal v2.0
            </h2>
            <p className="text-blue-100/80 mb-6 italic">
              Zautomatyzowana analiza spraw oraz transformacja dokumentów oparta o wielomodelową orkiestrację AI.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-blue-500/20 rounded-full border border-blue-400/30 text-xs font-bold text-blue-300">
                Gemini 1.5 Pro
              </span>
              <span className="px-3 py-1 bg-purple-500/20 rounded-full border border-purple-400/30 text-xs font-bold text-purple-300">
                Llama 3.1 (Cerebras)
              </span>
              <span className="px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-400/30 text-xs font-bold text-indigo-300">
                Mistral Large
              </span>
            </div>
          </div>
          <Zap className="absolute right-0 top-0 w-64 h-64 text-white/5 -mr-20 -mt-20 transform rotate-12" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Query Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Nowa Analiza</h3>
              <p className="text-sm text-slate-500 mb-6">
                Wprowadź krótki opis sprawy lub wklej treść dokumentu, który chcesz sprawdzić pod kątem ryzyk prawnych.
              </p>
              <textarea
                value={aiAnalysisQuery}
                onChange={(e) => setAiAnalysisQuery(e.target.value)}
                placeholder="Np. Mam zaległości w opłatach za wynajem lokalu, właściciel grozi eksmisją bez zachowania okresu wypowiedzenia..."
                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm resize-none mb-4"
              />
              <button
                onClick={handleAnalyzeCase}
                disabled={isAiLoading || !aiAnalysisQuery.trim()}
                className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${isAiLoading
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900 text-white hover:bg-blue-700 shadow-blue-500/20"
                  }`}
              >
                {isAiLoading ? (
                  <>
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                    Analizowanie...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Uruchom Analizę AI
                  </>
                )}
              </button>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Gwarancja Prywatności
              </h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                Wszystkie dane przesyłane do Asystenta AI są anonimizowane za pomocą modułu <strong>PII Sanitize</strong> przed wysłaniem do zewnętrznych providerów. Twoje dane osobowe nigdy nie opuszczają serwerów Lexportal w formie niezaszyfrowanej.
              </p>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white min-h-[500px] rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Wynik Analizy Prawnej</h3>
                {aiAnalysisResult && (
                  <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded">
                    Status: OK
                  </span>
                )}
              </div>

              <div className="flex-1 p-8">
                {!aiAnalysisResult ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center max-w-md mx-auto">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <Zap className="w-10 h-10 opacity-20" />
                    </div>
                    <h4 className="text-slate-900 font-bold mb-2">Brak aktywnej analizy</h4>
                    <p className="text-sm">
                      Wprowadź dane po lewej stronie i uruchom silnik AI, aby otrzymać natychmiastową ocenę ryzyka i rekomendacje.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                    {/* risks */}
                    <section>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" /> Analiza Ryzyk
                      </h4>
                      <div className="space-y-3">
                        {aiAnalysisResult.risks?.map((r: any, i: number) => (
                          <div key={i} className={`p-4 rounded-xl border flex gap-3 ${r.level === "CRITICAL" ? "bg-red-50 border-red-100 text-red-900" :
                            r.level === "WARNING" ? "bg-orange-50 border-orange-100 text-orange-900" :
                              "bg-blue-50 border-blue-100 text-blue-900"
                            }`}>
                            <div className="font-bold text-xs mt-0.5">{r.level}</div>
                            <div className="text-sm">{r.desc}</div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* recommendations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <section>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" /> Rekomendacje
                        </h4>
                        <ul className="space-y-3">
                          {aiAnalysisResult.recommendations?.map((rec: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm text-slate-700">
                              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">
                                {i + 1}
                              </span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" /> Brakujące Dokumenty
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {aiAnalysisResult.missing_docs?.map((doc: string, i: number) => (
                            <span key={i} className="px-3 py-2 bg-slate-100 text-slate-800 rounded-lg text-xs font-medium border border-slate-200">
                              {doc}
                            </span>
                          ))}
                        </div>
                      </section>
                    </div>

                    {/* summary */}
                    <section className="pt-8 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900 mb-3">Podsumowanie Eksperckie</h4>
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">
                        &quot;{aiAnalysisResult.summary}&quot;
                      </p>
                    </section>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMail = () => {
    const selectedMail = mail.find((m) => m.id === selectedMailId);
    const filteredMail = mail.filter((m) => {
      if (activeMailFilter === "archived") return m.archived;
      if (activeMailFilter === "sent") return m.sent && !m.archived;
      return !m.archived && !m.sent;
    });

    return (
      <div className="h-[calc(100vh-140px)] flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in font-sans">
        {/* Mail Sidebar */}
        <div className="w-64 border-r border-slate-100 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-100">
            <button
              onClick={() => {
                setNewMailData({ to: "", subject: "", content: "" });
                setShowNewMailModal(true);
              }}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nowa wiadomość
            </button>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            <button
              onClick={() => setActiveMailFilter("inbox")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${activeMailFilter === "inbox" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"} `}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" /> Odebrane
              </div>
              {mail.filter((m) => !m.read && !m.archived && !m.sent).length >
                0 && (
                  <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {mail.filter((m) => !m.read && !m.archived && !m.sent).length}
                  </span>
                )}
            </button>
            <button
              onClick={() => setActiveMailFilter("sent")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${activeMailFilter === "sent" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"} `}
            >
              <Send className="w-4 h-4" /> Wysłane
            </button>
            <button
              onClick={() => setActiveMailFilter("archived")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${activeMailFilter === "archived" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"} `}
            >
              <Clock className="w-4 h-4" /> Archiwum
            </button>
          </nav>
        </div>

        {/* Mail List */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${selectedMailId ? "hidden md:flex" : "flex"} `}
        >
          <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Szukaj w poczcie..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filteredMail.length > 0 ? (
              filteredMail.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedMailId(m.id);
                    if (!m.read) {
                      messagesApi
                        .update(String(m.id), { is_read: true })
                        .then(() => {
                          setMail((prev) =>
                            prev.map((msg) =>
                              msg.id === m.id ? { ...msg, read: true } : msg,
                            ),
                          );
                        })
                        .catch((err) =>
                          console.error("Failed to mark as read:", err),
                        );
                    }
                  }}
                  className={`p-4 cursor-pointer hover: bg-blue-50 / 30 transition-colors flex items-start gap-4 ${!m.read ? "bg-blue-50/50" : ""} ${selectedMailId === m.id ? "border-l-4 border-blue-600 bg-blue-50/80" : "border-l-4 border-transparent"} `}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${!m.read ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"} `}
                  >
                    {m.from.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4
                        className={`text-sm truncate ${!m.read ? "font-bold text-slate-900" : "text-slate-600"} `}
                      >
                        {m.from}
                      </h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {m.date}
                      </span>
                    </div>
                    <p
                      className={`text-xs truncate ${!m.read ? "font-bold text-blue-600" : "text-slate-500"} `}
                    >
                      {m.subject}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-1">
                      {m.content}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                <Mail className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm italic">
                  Brak wiadomości w tej kategorii
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mail Content */}
        <div
          className={`flex-[1.5] flex flex-col min-w-0 bg-white border-l border-slate-100 transition-all ${selectedMailId ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0 pointer-events-none hidden md:flex"} `}
        >
          {selectedMail ? (
            <>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedMailId(null)}
                  className="md:hidden p-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportMailPDF(selectedMail)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Eksportuj do PDF"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  {selectedMail.archived ? (
                    <button
                      onClick={() => handleRestoreMail(selectedMail.id)}
                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Przywróć z archiwum"
                    >
                      <RefreshCcw className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArchiveMail(selectedMail.id)}
                      className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Archiwizuj"
                    >
                      <Clock className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteMail(selectedMail.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Usuń permanentnie"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    {selectedMail.subject}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {selectedMail.from.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        {selectedMail.from}
                      </p>
                      <p className="text-xs text-slate-500">
                        Do: ja@example.com • {selectedMail.date}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed">
                  {selectedMail.content.split("\n").map((para, i) => (
                    <p key={i} className="mb-4">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReply(selectedMail)}
                    className="flex-1 bg-white border border-slate-200 py-2.5 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Odpowiedz
                  </button>
                  <button
                    onClick={() => handleForward(selectedMail)}
                    className="flex-1 bg-white border border-slate-200 py-2.5 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Przekaż dalej
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
              <Mail className="w-16 h-16 mb-4 opacity-10" />
              <p className="italic">
                Wybierz wiadomość, aby przeczytać jej treść
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ChatModule = () => {
    const [operators, setOperators] = useState<
      Array<{ id: string; email: string; display_name: string }>
    >([]);
    const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(
      null,
    );
    const [selectedOperatorName, setSelectedOperatorName] =
      useState<string>("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loadingOps, setLoadingOps] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Pobierz listę operatorów przy montowaniu
    useEffect(() => {
      const fetchOperators = async () => {
        try {
          const ops = await usersApi.listByRole("operator");
          setOperators(ops);
        } catch (err) {
          console.error("Failed to fetch operators:", err);
        } finally {
          setLoadingOps(false);
        }
      };
      fetchOperators();
    }, []);

    // Pobieraj i odświeżaj wiadomości gdy wybrany operator
    useEffect(() => {
      if (!selectedOperatorId) return;
      const fetchMsgs = async () => {
        try {
          const all = await messagesApi.list();
          if (Array.isArray(all)) {
            type MsgItem = {
              id: string | number;
              sender_id?: string | number;
              recipient_id?: string | number;
              content?: string;
              created_at?: string;
            };
            const filtered = all.filter(
              (m: MsgItem) =>
                m.sender_id === selectedOperatorId ||
                m.recipient_id === selectedOperatorId,
            );
            setMessages(
              filtered.map((m: MsgItem) => ({
                id: Number(m.id),
                sender: m.sender_id === selectedOperatorId ? "lawyer" : "user",
                text: m.content,
                timestamp: new Date(m.created_at).toLocaleString("pl-PL"),
              })),
            );
          }
        } catch (err) {
          console.error("Failed to fetch messages:", err);
        }
      };
      fetchMsgs();
      const iv = setInterval(fetchMsgs, 5000);
      return () => clearInterval(iv);
    }, [selectedOperatorId]);

    // Scroll do ostatniej wiadomości
    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
      if (!input.trim() || !selectedOperatorId || sending) return;
      setSending(true);
      try {
        await messagesApi.send({
          recipient_id: selectedOperatorId,
          content: input.trim(),
          subject: "Bezpieczny Czat",
        });
        setInput("");
        // Natychmiastowe odświeżenie
        const all = await messagesApi.list();
        if (Array.isArray(all)) {
          type MsgItem2 = {
            id: string | number;
            sender_id?: string | number;
            recipient_id?: string | number;
            content?: string;
            created_at?: string;
          };
          const filtered = all.filter(
            (m: MsgItem2) =>
              m.sender_id === selectedOperatorId ||
              m.recipient_id === selectedOperatorId,
          );
          setMessages(
            filtered.map((m: MsgItem2) => ({
              id: Number(m.id),
              sender: m.sender_id === selectedOperatorId ? "lawyer" : "user",
              text: m.content,
              timestamp: new Date(m.created_at).toLocaleString("pl-PL"),
            })),
          );
        }
      } catch (err) {
        console.error("Failed to send message:", err);
      } finally {
        setSending(false);
      }
    };

    const saveChat = () => {
      const content = messages
        .map(
          (m) =>
            `[${m.timestamp}] ${m.sender === "user" ? "Klient" : "Prawnik"}: ${m.text} `,
        )
        .join("\n");
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Czat_LexPortal_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (loadingOps) {
      return (
        <div className="h-[calc(100vh-140px)] flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="text-slate-400">Ładowanie operatorów...</div>
        </div>
      );
    }

    // Widok wyboru operatora
    if (!selectedOperatorId) {
      return (
        <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
          <div className="bg-slate-900 p-5 text-white shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-400" />
              Bezpieczny Czat
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Wybierz operatora, z którym chcesz porozmawiać
            </p>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {operators.length === 0 ? (
              <div className="text-center text-slate-400 py-10">
                Brak dostępnych operatorów
              </div>
            ) : (
              <div className="space-y-3">
                {operators.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => {
                      setSelectedOperatorId(op.id);
                      setSelectedOperatorName(op.display_name || op.email);
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-left"
                  >
                    <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                      {(op.display_name || op.email)[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-800 font-semibold truncate">
                        {op.display_name || op.email}
                      </div>
                      <div className="text-slate-500 text-sm truncate">
                        {op.email}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Widok czatu z wybranym operatorem
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in font-sans">
        {/* Chat Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedOperatorId(null);
                setMessages([]);
              }}
              className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              title="Wróć do listy"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-sm">
                {selectedOperatorName[0]?.toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <div>
              <h3 className="font-bold text-sm">{selectedOperatorName}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Szyfrowane E2EE
              </p>
            </div>
          </div>
          <button
            onClick={saveChat}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white"
            title="Zapisz rozmowę"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 py-10 text-sm">
              Brak wiadomości. Napisz pierwszą wiadomość do operatora!
            </div>
          )}
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} `}
            >
              <div
                className={`max-w-[75 %] flex flex-col ${m.sender === "user" ? "items-end" : "items-start"} `}
              >
                <div
                  className={`p-3 rounded-2xl text-sm shadow-sm ${m.sender === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                    } `}
                >
                  <p>{m.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="flex gap-2 items-end">
            <button
              className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              title="Załącz plik"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1 bg-slate-100 rounded-xl px-4 py-2 border border-transparent focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), sendMessage())
                }
                placeholder="Napisz wiadomość do operatora..."
                className="w-full bg-transparent border-none outline-none text-sm text-slate-900 resize-none max-h-24 py-1"
                rows={1}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = (await casesApi.create({
        title: newCaseData.title,
        description: newCaseData.description,
        category: newCaseData.category,
      })) as any;
      setCases([
        {
          id: created.id,
          title: created.title,
          category:
            (created as { category?: string; description?: string }).category ||
            newCaseData.category,
          status: "Oczekuje",
          progress: 0,
          lastUpdate: "Przed chwilą",
          description:
            (created as { category?: string; description?: string })
              .description || newCaseData.description,
        },
        ...cases,
      ]);
      setShowNewCaseModal(false);
      setNewCaseData({ title: "", category: "Inne", description: "" });
      setActiveView("cases");
    } catch (error) {
      console.error("Failed to create case:", error);
      alert("Błąd tworzenia sprawy. Spróbuj ponownie.");
    }
  };

  // --- MODALS RENDER ---
  return (
    <div className="flex min-h-screen bg-slate-100 font-sans overflow-hidden">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* EXISTING CONTENT (Sidebar + Main) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 shadow-2xl lg: translate-x-0 lg:static lg: inset-auto ${sidebarOpen
          ? "translate-x-0 w-64"
          : "-translate-x-full lg:w-20 lg:translate-x-0"
          } `}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/50 bg-slate-950">
          <span className="text-white font-sans font-bold text-lg tracking-wide flex items-center gap-2">
            <Layout className="w-5 h-5 text-amber-500" />
            {(sidebarOpen || window.innerWidth < 1024) && "Panel Klienta"}
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-500 hover:text-white lg:hidden"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-1 px-3">
          <NavItem
            icon={<Layout className="w-5 h-5" />}
            label="Pulpit"
            active={activeView === "dashboard"}
            onClick={() => {
              setActiveView("dashboard");
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            expanded={sidebarOpen}
          />
          <NavItem
            icon={<Briefcase className="w-5 h-5" />}
            label="Moje Sprawy"
            active={activeView === "cases"}
            onClick={() => {
              setActiveView("cases");
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            expanded={sidebarOpen}
          />
          <NavItem
            icon={<Mail className="w-5 h-5" />}
            label="Poczta"
            active={activeView === "mail"}
            onClick={() => {
              setActiveView("mail");
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            expanded={sidebarOpen}
          />
          <NavItem
            icon={<MessageSquare className="w-5 h-5" />}
            label="Bezpieczny Czat"
            active={activeView === "chat"}
            onClick={() => {
              setActiveView("chat");
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            expanded={sidebarOpen}
          />
          <NavItem
            icon={<Calendar className="w-5 h-5" />}
            label="Terminarz"
            active={activeView === "calendar"}
            onClick={() => {
              setActiveView("calendar");
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            expanded={sidebarOpen}
          />
          <NavItem
            icon={<CreditCard className="w-5 h-5" />}
            label="Płatności"
            active={activeView === "payments"}
            onClick={() => {
              setActiveView("payments");
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            expanded={sidebarOpen}
          />
          <NavItem
            icon={<Settings className="w-5 h-5" />}
            label="Ustawienia"
            active={activeView === "settings"}
            onClick={() => {
              setActiveView("settings");
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            expanded={sidebarOpen}
          />
          <NavItem
            icon={<Zap className="w-5 h-5" />}
            label="Asystent AI"
            active={activeView === "ai_assistant"}
            onClick={() => {
              setActiveView("ai_assistant");
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            expanded={sidebarOpen}
          />
          <NavItem
            icon={<HelpCircle className="w-5 h-5" />}
            label="Pomoc"
            active={activeView === "help"}
            onClick={() => {
              setActiveView("help");
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            expanded={sidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-slate-800/50 bg-slate-950 space-y-2">
          <button
            onClick={() => navigate("/polityka-prywatnosci")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-slate-800 transition-all text-slate-400 hover:text-white"
          >
            <ShieldCheck className="w-4 h-4" />
            {sidebarOpen && (
              <span className="text-xs font-medium">Prywatność (RODO)</span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg hover: bg-red-900 / 30 hover: text-red-400 transition-all text-red-500 ${!sidebarOpen && "lg:justify-center"
              } `}
          >
            <LogOut className="w-5 h-5" />{" "}
            {(sidebarOpen || window.innerWidth < 1024) && (
              <span className="text-sm font-medium">Wyloguj</span>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        {/* Header and Content */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-slate-900 font-bold text-lg truncate max-w-[150px] sm:max-w-none">
              {activeView === "dashboard"
                ? "Pulpit"
                : activeView === "cases"
                  ? "Twoje Sprawy"
                  : activeView === "chat"
                    ? "Czat z Prawnikiem"
                    : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.some((n) => n.unread) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-2 z-50">
                  <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                    <h4 className="font-bold text-sm">Powiadomienia</h4>
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-slate-400 hover:text-white uppercase tracking-wider font-bold"
                    >
                      Oznacz jako przeczytane
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-4 hover: bg-slate-50 transition-colors cursor-pointer ${n.unread ? "bg-blue-50/50" : ""} `}
                        >
                          <p className="text-sm text-slate-800 leading-snug">
                            {n.text}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {n.date}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-sm italic">
                        Brak nowych powiadomień
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                    <button className="text-xs text-blue-600 font-bold hover:underline">
                      Zobacz wszystkie
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">Jan Kowalski</p>
                <p className="text-xs text-slate-500">Klient Indywidualny</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                JK
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8 overflow-x-hidden">
          {activeView === "dashboard" && renderDashboard()}
          {activeView === "cases" && renderCases()}
          {activeView === "calendar" && renderCalendar()}
          {activeView === "payments" && renderPayments()}
          {activeView === "settings" && renderSettings()}
          {activeView === "help" && renderHelp()}
          {activeView === "chat" && <ChatModule />}
          {activeView === "mail" && renderMail()}
          {activeView === "ai_assistant" && renderAIAssistant()}
        </div>
      </main>

      {/* MODALS */}

      {/* New Mail Modal */}
      {showNewMailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowNewMailModal(false)}
          ></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-500" /> Nowa Wiadomość
              </h3>
              <button
                onClick={() => setShowNewMailModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendMail} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Odbiorca
                </label>
                <input
                  type="text"
                  value={newMailData.to}
                  onChange={(e) =>
                    setNewMailData({ ...newMailData, to: e.target.value })
                  }
                  placeholder="np. Mec. Anna Nowak"
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Temat
                </label>
                <input
                  type="text"
                  value={newMailData.subject}
                  onChange={(e) =>
                    setNewMailData({ ...newMailData, subject: e.target.value })
                  }
                  placeholder="Temat wiadomości"
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Treść
                </label>
                <textarea
                  value={newMailData.content}
                  onChange={(e) =>
                    setNewMailData({ ...newMailData, content: e.target.value })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none h-48 resize-none"
                  placeholder="Treść wiadomości..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewMailModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Wyślij
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal-Appointment (Consolidated) */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowAppointmentModal(false);
              setEditingEventId(null);
              setNewEvent({ title: "", time: "09:00", description: "" });
            }}
          ></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />{" "}
                {editingEventId ? "Edytuj termin" : "Dodaj termin"}
              </h3>
              <button
                onClick={() => {
                  setShowAppointmentModal(false);
                  setEditingEventId(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="event-title"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Tytuł wydarzenia
                </label>
                <input
                  id="event-title"
                  type="text"
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 bg-white"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  placeholder="np. Spotkanie z mecenasem"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 bg-white"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Godzina
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 bg-white"
                    value={newEvent.time}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Opis (opcjonalnie)
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-slate-900 outline-none resize-none text-slate-900 bg-white"
                  rows={3}
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                ></textarea>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAppointmentModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold shadow-lg shadow-slate-900/20"
                >
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Case Modal-Already Defined in code, just kept here implicitly by not modifying it if it's outside the range I replaced. NO, I replaced the whole return. I need to include it. */}
      {showNewCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowNewCaseModal(false)}
          ></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-500" /> Utwórz nową
                sprawę
              </h3>
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCase} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tytuł sprawy
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Pozew o zapłatę od X"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
                  value={newCaseData.title}
                  onChange={(e) =>
                    setNewCaseData({ ...newCaseData, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="new-case-category"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Kategoria
                </label>
                <select
                  id="new-case-category"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                  value={newCaseData.category}
                  onChange={(e) =>
                    setNewCaseData({ ...newCaseData, category: e.target.value })
                  }
                >
                  <option>Inne</option>
                  <option>Prawo Rodzinne</option>
                  <option>Prawo Pracy</option>
                  <option>Nieruchomości</option>
                  <option>Windykacja</option>
                  <option>Spadki</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Krótki opis
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none text-slate-900 bg-white"
                  placeholder="Opisz czego dotyczy sprawa..."
                  value={newCaseData.description}
                  onChange={(e) =>
                    setNewCaseData({
                      ...newCaseData,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewCaseModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm"
                >
                  Utwórz sprawę
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setSelectedCase(null)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-in zoom-in-95 font-sans">
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
              <div>
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest block mb-1">
                  Szczegóły Sprawy
                </span>
                <h3 className="font-bold text-xl">{selectedCase.title}</h3>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                    ID
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedCase.id}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Status
                  </p>
                  <p className="text-sm font-semibold text-blue-600">
                    {selectedCase.status}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Kategoria
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedCase.category}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Postęp
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedCase.progress}%
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2 underline underline-offset-4 decoration-blue-500 decoration-2">
                  Opis Sprawy
                </h4>
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 min-h-[100px]">
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedCase.description ||
                      "Brak dodatkowego opisu dla tej sprawy."}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-3">
                    Ostatnie dokumenty
                  </h4>
                  <div className="space-y-3">
                    {selectedCase.documents &&
                      selectedCase.documents.length > 0 ? (
                      selectedCase.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 group/item hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm">
                              <FileText className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {doc.filename}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(doc.created_at).toLocaleDateString(
                                  "pl-PL",
                                )}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              documentsApi.download(doc.id, doc.filename)
                            }
                            className="p-2 text-gray-400 hover:text-emerald-500 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Brak dokumentów przypisanych do tej sprawy.
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-3">
                    Kontakt ze sprawą
                  </h4>
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <p className="text-xs text-indigo-900 font-bold mb-1">
                      Mec. Anna Nowak
                    </p>
                    <p className="text-[10px] text-indigo-700 mb-3">
                      Główny opiekun prawny
                    </p>
                    <button
                      onClick={() => (
                        setSelectedCase(null),
                        setActiveView("chat")
                      )}
                      className="w-full bg-white text-indigo-700 py-2 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-2 border border-indigo-200"
                    >
                      <MessageSquare className="w-3 h-3" /> Napisz wiadomość
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              >
                <RefreshCcw className="w-3 h-3" /> Historia zmian
              </button>
              <button
                onClick={() => handleExportPDF(selectedCase)}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 text-sm"
              >
                <Download className="w-4 h-4" /> Eksportuj do PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHistoryModal(false)}
          ></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 font-sans">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <RefreshCcw className="w-4 h-4 text-amber-500" /> Historia Zmian
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {isLoadingHistory ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : caseHistory.length > 0 ? (
                caseHistory.map((h, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-slate-700"
                  >
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium font-mono uppercase tracking-wider mb-1">
                        {new Date(h.timestamp).toLocaleString("pl-PL")}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-1">
                        {h.action}
                      </p>
                      <p className="text-[10px] text-gray-400 italic">
                        Przez: {h.actor_name || "System"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8 italic">
                  Brak historii dla tej sprawy.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for Nav Items
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  expanded: boolean;
}

const NavItem = ({ icon, label, active, onClick, expanded }: NavItemProps) => (
  <button
    onClick={onClick}
    title={!expanded ? label : undefined}
    className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-all ${active
      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
      : "text-slate-300 hover:bg-slate-800 hover:text-white"
      } ${!expanded ? "justify-center" : ""} `}
  >
    {icon}
    {expanded && <span className="text-sm font-medium">{label}</span>}
  </button>
);

export default ClientDashboard;
