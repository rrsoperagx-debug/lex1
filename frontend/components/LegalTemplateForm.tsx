import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  X,
  Zap,
  CheckCircle2,
  Download,
  Eye,
  Send,
  Cpu,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LegalTemplate } from "../services/legalTemplateService";
import { documentsApi } from "../services/api";

interface LegalTemplateFormProps {
  template: LegalTemplate;
  onClose: () => void;
  onSuccess: (documentData: unknown) => void;
}

const LegalTemplateForm: React.FC<LegalTemplateFormProps> = ({
  template,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<"fields" | "generating" | "success">(
    "fields",
  );
  const [generatedDoc, setGeneratedDoc] = useState<Record<string, any> | null>(
    null,
  );
  const [isSendingToSign, setIsSendingToSign] = useState(false);
  const [sendToSignStatus, setSendToSignStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: any) => {
    setStep("generating");
    try {
      // Simulate network delay for "AI/Professional" feel
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await documentsApi.generate(template.id, data);
      setGeneratedDoc(result);
      setStep("success");
      onSuccess(result);
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Błąd generowania dokumentu.");
      setStep("fields");
    }
  };

  const handleSendToSign = async () => {
    if (!generatedDoc) return;
    setIsSendingToSign(true);
    setSendToSignStatus("idle");
    try {
      await documentsApi.sendToSign({
        caseId: "LP/2023/101", // Mock case ID for now, as LegalTemplateForm doesn't receive caseId
        documentId: generatedDoc.document_id,
        clientEmail: "klient@example.com", // This would normally come from the case or user input
        title: generatedDoc.filename,
      });
      setSendToSignStatus("success");
    } catch (error) {
      console.error("Sending to sign failed:", error);
      setSendToSignStatus("error");
    } finally {
      setIsSendingToSign(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {step === "success"
                  ? "Dokument Gotowy"
                  : `Generator: ${template.title}`}
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                System: LexPortal SmartGen v2.0
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {step === "fields" && (
              <motion.form
                key="fields"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-6">
                  <p className="text-xs text-blue-800 font-bold leading-relaxed flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Wypełnij pola poniżej, aby
                    wygenerować profesjonalną treść na podstawie wybranego
                    szablonu.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {template.fields?.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {field.label}{" "}
                        {field.required && (
                          <span className="text-rose-500">*</span>
                        )}
                      </label>
                      {field.type === "text" ||
                      field.type === "string" ||
                      field.type === "email" ? (
                        <input
                          {...register(field.id, { required: field.required })}
                          type={field.type === "email" ? "email" : "text"}
                          placeholder={field.placeholder || "Wpisz dane..."}
                          className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-slate-900 border-2 border-slate-50 focus:border-blue-100 placeholder:text-slate-300"
                        />
                      ) : field.type === "textarea" ||
                        field.type === "text_area" ? (
                        <textarea
                          {...register(field.id, { required: field.required })}
                          placeholder={
                            field.placeholder || "Wpisz szczegóły..."
                          }
                          rows={4}
                          className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-slate-900 border-2 border-slate-50 focus:border-blue-100 placeholder:text-slate-300"
                        />
                      ) : field.type === "date" ? (
                        <input
                          {...register(field.id, { required: field.required })}
                          type="date"
                          className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-slate-900 border-2 border-slate-50 focus:border-blue-100"
                        />
                      ) : (
                        <input
                          {...register(field.id, { required: field.required })}
                          className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-slate-900 border-2 border-slate-50 focus:border-blue-100"
                        />
                      )}
                      {errors[field.id] && (
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter ml-2">
                          To pole jest wymagane
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-slate-200 hover:-translate-y-1 flex items-center justify-center gap-3 uppercase tracking-widest"
                  >
                    Generuj Dokument{" "}
                    <Zap className="w-5 h-5 fill-emerald-400" />
                  </button>
                </div>
              </motion.form>
            )}

            {step === "generating" && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                  <Cpu className="absolute inset-0 m-auto w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">
                  Przetwarzanie AI...
                </h3>
                <p className="text-slate-500 font-bold max-w-xs">
                  Trwa wstrzykiwanie danych do bezpiecznego wzorca prawnego i
                  generowanie sum kontrolnych...
                </p>

                <div className="mt-8 w-48 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ left: "-100%" }}
                    animate={{ left: "100%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                    className="relative h-full w-1/2 bg-blue-600"
                  />
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-6 text-center"
              >
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-500 shadow-inner">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2">
                  Sukces!
                </h3>
                <p className="text-slate-500 font-bold mb-8 italic">
                  Twój dokument &quot;{generatedDoc?.filename}&quot; został
                  wygenerowany.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <a
                    href={generatedDoc?.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 p-5 bg-white border-2 border-slate-100 rounded-[24px] font-black text-slate-900 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-50 hover:-translate-y-1 transition-all group"
                  >
                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                      <Download className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
                    </div>
                    POBIERZ PDF
                  </a>

                  <button
                    onClick={handleSendToSign}
                    disabled={isSendingToSign || sendToSignStatus === "success"}
                    className={`flex items-center justify-center gap-3 p-5 rounded-[24px] font-black text-white hover:-translate-y-1 transition-all group ${
                      sendToSignStatus === "success"
                        ? "bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-200"
                        : sendToSignStatus === "error"
                          ? "bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-200"
                          : "bg-slate-900 hover:bg-black shadow-2xl shadow-slate-200"
                    }`}
                  >
                    <div className="p-2 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                      {isSendingToSign ? (
                        <div className="w-5 h-5 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                        </div>
                      ) : sendToSignStatus === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <Send className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    {isSendingToSign
                      ? "WYSYŁANIE..."
                      : sendToSignStatus === "success"
                        ? "WYSŁANO DO AUTENTI"
                        : sendToSignStatus === "error"
                          ? "BŁĄD WYSYŁKI"
                          : "WYŚLIJ DO PODPISU"}
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="mt-8 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                >
                  Zamknij Generator
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step === "fields" && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Shield className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-tight">
                Szyfrowanie TLS 1.3 Active
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i === 1 ? "bg-blue-600" : "bg-slate-200"}`}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LegalTemplateForm;
