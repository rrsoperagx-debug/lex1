import api from './api';

export interface LegalTemplateField {
    id: string;
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    default?: unknown;
    options?: unknown[];
}

export interface LegalTemplate {
    id: string;
    custom_id: string;
    title: string;
    content: string;
    category: string;
    description?: string;
    target_audience: 'client' | 'operator';
    risk_level: 'low' | 'medium' | 'high';
    fields?: LegalTemplateField[];
    ai_hints?: string;
    validation_rules?: Record<string, unknown>;
    logic?: string;
    required_attachments?: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const legalTemplateService = {
    getAll: (): Promise<LegalTemplate[]> => {
        return api.get('/legal-templates');
    },

    getById: (id: string): Promise<LegalTemplate> => {
        return api.get(`/legal-templates/${id}`);
    },

    create: (data: Partial<LegalTemplate>): Promise<LegalTemplate> => {
        return api.post('/legal-templates', data);
    },

    update: (id: string, data: Partial<LegalTemplate>): Promise<LegalTemplate> => {
        return api.put(`/legal-templates/${id}`, data);
    },

    delete: (id: string): Promise<void> => {
        return api.delete(`/legal-templates/${id}`);
    }
};

export default legalTemplateService;
