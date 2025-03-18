export interface Template {
    id: string;
    name: string;
    status: 'APPROVED' | 'PENDING' | 'REJECTED';
    category: string;
    language: string;
    components: {
        header?: {
            type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
            text?: string;
            example?: {
                header_handle: string[];
            };
        };
        body: {
            text: string;
            example?: {
                body_text: string[][];
            };
        };
        footer?: {
            text: string;
        };
        buttons?: TemplateButton[];
    };
    created_at?: string;
}

export type TemplateButton = {
    type: 'PHONE_NUMBER' | 'URL' | 'QUICK_REPLY' | 'FLOW';
    text: string;
    phone_number?: string;
    url?: string;
    example?: string[];
    // Flow-specific properties
    flow_id?: string;
    flow_token?: string;
    target_screen?: string;
};

export type CreateTemplatePayload = {
    name: string;
    category: string;
    language: string;
    components: {
        header?: {
            format: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
            text?: string;
        };
        body: {
            text: string;
        };
        footer?: {
            text: string;
        };
        buttons?: (TemplateButton | FlowButton)[];
    };
};

// Additional type for flow buttons
export type FlowButton = {
    type: 'FLOW';
    text: string;
    flow_id: string;
    flow_token: string;
    target_screen: string;
    example?: string[];
};