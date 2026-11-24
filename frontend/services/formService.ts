import api from './api';

export interface FormFieldValidation {
  required?: boolean;
  minLength?: number;
  pattern?: string;
  message?: string;
  [key: string]: unknown;
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "select" | "checkbox" | "textarea";
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: FormFieldValidation;
  ui_width?: "half" | "full";
}

export interface FormStep {
  step_id: number;
  step_title: string;
  fields: FormField[];
}

export interface FormTemplate {
  id: string;
  code: string;
  title: string;
  category: string;
  schema_definition: {
    form_title: string;
    form_code: string;
    steps: FormStep[];
    completion_settings: {
      submit_button_text: string;
      success_message: string;
    };
  };
}

export interface UserFormDraft {
  id: string;
  template_id: string;
  data: Record<string, unknown>;
  status: string;
}

const formService = {
  getTemplates: (): Promise<FormTemplate[]> => {
    return api.get('/forms/templates');
  },

  getTemplateByCode: (code: string): Promise<FormTemplate> => {
    return api.get(`/forms/templates/${code}`);
  },

  getDraft: (draftId: string): Promise<UserFormDraft> => {
    return api.get(`/forms/drafts/${draftId}`);
  },

  saveDraft: (
    templateId: string,
    data: Record<string, unknown>,
    draftId?: string,
  ): Promise<UserFormDraft> => {
    if (draftId) {
      return api.put(`/forms/drafts/${draftId}`, {
        template_id: templateId,
        data: data,
      });
    } else {
      return api.post("/forms/drafts", {
        template_id: templateId,
        data: data,
      });
    }
  },

  generatePdf: (draftId: string): Promise<{ document_id: string; file_url: string }> => {
    return api.post(`/forms/generate/${draftId}`);
  }
};

export default formService;
