import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Loader2,
  FileText,
  Send,
  AlertCircle,
} from "lucide-react";
import formService, {
  FormTemplate,
  FormStep,
} from "../../services/formService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "./ui/checkbox";
import { Progress } from "./ui/progress";
import { useAuth } from "../../context/AuthContext";

interface SmartFormRendererProps {
  template: FormTemplate;
  onComplete: (documentId: string, fileUrl: string) => void;
}

const SmartFormRenderer: React.FC<SmartFormRendererProps> = ({
  template,
  onComplete,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { user } = useAuth();

  const steps = template.schema_definition.steps;
  const currentStep = steps[currentStepIdx];

  const buildSchema = (step: FormStep) => {
    const shape: Record<string, z.ZodTypeAny> = {};
    step.fields.forEach((field) => {
      let validator: z.ZodTypeAny = z.any();
      if (
        field.type === "text" ||
        field.type === "textarea" ||
        field.type === "select"
      ) {
        let strValidator = z.string();
        if (field.validation?.required) {
          strValidator = strValidator.min(1, "To pole jest wymagane");
        }
        if (field.validation?.pattern) {
          strValidator = strValidator.regex(
            new RegExp(field.validation.pattern),
            field.validation.message || "Błędny format",
          );
        }
        if (field.validation?.minLength) {
          strValidator = strValidator.min(
            field.validation.minLength,
            `Minimum ${field.validation.minLength} znaki`,
          );
        }
        validator = strValidator;
      } else if (field.type === "checkbox") {
        let boolValidator = z.boolean();
        if (field.validation?.required) {
          boolValidator = boolValidator.refine(
            (val: boolean) => val === true,
            "Musisz zaakceptować to oświadczenie",
          );
        }
        validator = boolValidator;
      }
      shape[field.id] = field.validation?.required
        ? validator
        : validator.optional().nullable();
    });
    return z.object(shape);
  };

  const methods = useForm({
    resolver: zodResolver(buildSchema(currentStep)),
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = methods;

  useEffect(() => {
    if (user && user.profile) {
      const profileData: Record<string, string> = {
        first_name: user.profile.first_name || "",
        last_name: user.profile.last_name || "",
        pesel: user.profile.pesel || "",
      };

      Object.entries(profileData).forEach(([key, value]) => {
        if (value) setValue(key, value);
      });
    }
  }, [user, setValue]);

  const handleAutoSave = useCallback(async () => {
    const currentData = getValues();
    if (Object.keys(currentData).length === 0) return;

    setIsSaving(true);
    try {
      const draft = await formService.saveDraft(
        template.id,
        currentData,
        draftId || undefined,
      );
      if (!draftId) setDraftId(draft.id);
    } catch (error) {
      console.error("Autosave failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [draftId, template.id, getValues]);

  useEffect(() => {
    const interval = setInterval(() => {
      handleAutoSave();
    }, 30000);
    return () => clearInterval(interval);
  }, [handleAutoSave]);

  const onNext = async (_data: Record<string, unknown>) => {
    setErrorMsg(null);
    await handleAutoSave();
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      generateDocument();
    }
  };

  const generateDocument = async () => {
    setIsGenerating(true);
    try {
      // Final save
      const currentData = getValues();
      const draft = await formService.saveDraft(
        template.id,
        currentData,
        draftId || undefined,
      );
      const result = await formService.generatePdf(draft.id);
      onComplete(result.document_id, result.file_url);
    } catch (error) {
      console.error("Generation failed:", error);
      setErrorMsg(
        "Wystąpił błąd podczas generowania dokumentu. Spróbuj ponownie.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const progress = ((currentStepIdx + 1) / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden font-sans relative">
      <div className="bg-slate-50/50 p-8 border-b border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-emerald-600 font-bold text-sm uppercase tracking-widest block mb-1">
              Krok {currentStepIdx + 1} z {steps.length}
            </span>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">
              {template.schema_definition.form_title}
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 min-w-32 justify-center">
            {isSaving ? (
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
            ) : (
              <Save className="w-4 h-4 text-slate-300" />
            )}
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
              {isSaving ? "Zapisywanie..." : "Zapisano aut."}
            </span>
          </div>
        </div>
        <Progress
          value={progress}
          indicatorClassName="bg-emerald-500 transition-all duration-700 h-2"
          className="h-2"
        />
      </div>

      <div className="p-10 min-h-[400px]">
        {errorMsg && (
          <div className="mb-6 bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            {errorMsg}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "circOut" }}
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white text-sm font-black">
                {currentStepIdx + 1}
              </span>
              {currentStep.step_title}
            </h2>

            <form
              onSubmit={handleSubmit(onNext)}
              className="grid grid-cols-2 gap-x-8 gap-y-6"
            >
              {currentStep.fields.map((field) => (
                <div
                  key={field.id}
                  className={
                    field.ui_width === "full" ? "col-span-2" : "col-span-1"
                  }
                >
                  <Label
                    htmlFor={field.id}
                    className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block"
                  >
                    {field.label}{" "}
                    {field.validation?.required && (
                      <span className="text-rose-500 ml-1">*</span>
                    )}
                  </Label>

                  {field.type === "text" && (
                    <Input
                      id={field.id}
                      placeholder={field.placeholder}
                      {...register(field.id)}
                      className={`h-14 bg-slate-50 border-transparent rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 font-semibold px-6 shadow-sm ${errors[field.id] ? "ring-2 ring-rose-500" : ""}`}
                    />
                  )}

                  {field.type === "select" && (
                    <Select
                      onValueChange={(val) => setValue(field.id, val)}
                      value={String(watch(field.id) || "")}
                    >
                      <SelectTrigger className="h-14 bg-slate-50 border-transparent rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 font-semibold px-6 shadow-sm">
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {field.type === "checkbox" && (
                    <div className="flex items-center space-x-3 bg-slate-50 p-6 rounded-2xl border-2 border-transparent hover:border-emerald-100 transition-all shadow-sm">
                      <Checkbox
                        id={field.id}
                        checked={Boolean(watch(field.id))}
                        onChange={(e) => setValue(field.id, e.target.checked)}
                      />
                      <Label
                        htmlFor={field.id}
                        className="text-sm font-bold text-slate-600 leading-relaxed cursor-pointer select-none"
                      >
                        {field.label}
                      </Label>
                    </div>
                  )}

                  <AnimatePresence>
                    {errors[field.id] && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-rose-500 text-[10px] mt-2 font-black uppercase tracking-tighter flex items-center gap-1.5 ml-2"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {errors[field.id]?.message as string}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              <div className="col-span-2 flex justify-between items-center mt-12 pt-8 border-t border-slate-50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (currentStepIdx > 0)
                      setCurrentStepIdx((prev) => prev - 1);
                  }}
                  disabled={currentStepIdx === 0}
                  className="rounded-2xl h-12 px-8 font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest text-xs"
                >
                  <ChevronLeft className="mr-2 w-4 h-4" /> Wstecz
                </Button>

                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="rounded-2xl h-14 px-12 bg-slate-900 hover:bg-black text-white font-black text-base shadow-xl shadow-slate-200 hover:-translate-y-0.5 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                      Przetwarzanie...
                    </>
                  ) : currentStepIdx === steps.length - 1 ? (
                    <>
                      <Send className="mr-2 w-5 h-5 text-emerald-400" />{" "}
                      {
                        template.schema_definition.completion_settings
                          .submit_button_text
                      }
                    </>
                  ) : (
                    <>
                      Kontynuuj <ChevronRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="w-32 h-32 mb-10 relative">
              <div className="absolute inset-0 border-8 border-slate-50 rounded-full"></div>
              <div className="absolute inset-0 border-8 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
              <FileText className="absolute inset-0 m-auto w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">
              Generowanie PDF
            </h3>
            <p className="text-slate-500 font-bold text-lg max-w-sm leading-relaxed">
              Trwa asynchroniczne „wstrzykiwanie” Twoich danych do oficjalnego
              szablonu urzędowego...
            </p>
            <div className="mt-12 w-64 bg-slate-100 h-2 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute top-0 bottom-0 w-1/2 bg-linear-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartFormRenderer;
