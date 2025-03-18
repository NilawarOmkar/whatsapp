import { NextResponse } from 'next/server';
import { Template, CreateTemplatePayload } from '@/types';

const BASE_URL = 'https://graph.facebook.com/v19.0';
const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_WHATSAPP_API_TOKEN;

export async function GET() {
    try {
        const response = await fetch(
            `${BASE_URL}/${WABA_ID}/message_templates?fields=name,status,category,language,components`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                },
            }
        );
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const payload: CreateTemplatePayload = await request.json();
        console.log("payload ", payload);
        const response = await fetch(
            `${BASE_URL}/${WABA_ID}/message_templates`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                },
                body: JSON.stringify(payload),
            }
        );
        const data = await response.json();
        console.log("data ", data);
        return NextResponse.json(data);
    } catch (error) {
        console.log("error ", error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const templateId = searchParams.get('id');
        
        if (!templateId) {
            return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
        }

        const response = await fetch(
            `${BASE_URL}/${WABA_ID}/message_templates?name=${templateId}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: errorData }, { status: response.status });
        }

        return NextResponse.json({ message: 'Template deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting template:', error);
        return NextResponse.json(
            { error: 'Failed to delete template' },
            { status: 500 }
        );
    }
}
