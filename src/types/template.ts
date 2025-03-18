export type Flow = {
    flow_token: string;
    flow_id: string;
    flow_cta: string;
    flow_action: string;
}

export type TemplateComponents = {
    header?: {
        type: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
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
    flows?: Flow[];
}

export type TemplateButton = {
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "FLOW";
    text: string;
    flow_token?: string;
    flow_id?: string;
}

export type Template = {
    id: string;
    name: string;
    category?: string;
    status: string;
    language?: string;
    components: TemplateComponents;
} 