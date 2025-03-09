import { NextRequest, NextResponse } from "next/server";

const WHATSAPP_ACCESS_TOKEN = process.env.NEXT_PUBLIC_WHATSAPP_API_TOKEN;
const PHONE_NUMBER_ID = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID;

export async function POST(request: NextRequest) {
    try {
        const { id, number } = await request.json();

        const payload = {
            messaging_product: "whatsapp",
            to: number,
            type: "interactive",
            interactive: {
                type: "flow",
                header: {
                    type: "text",
                    text: "Want to get notified about our exclusive sale?"
                },
                body: {
                    text: "Sign up for our exclusive sale notification service and get 24 hours advance notification."
                },
                footer: {
                    text: "Don't miss out, Join Now!"
                },
                action: {
                    name: "flow",
                    parameters: {
                        flow_message_version: "3",
                        flow_token: id,
                        flow_id: id,
                        flow_cta: "Continue!"
                    }
                }
            }
        };

        const response = await fetch(
            `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                },
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            return NextResponse.json({ error: response.json() }, { status: 500 });
        }

        return NextResponse.json({ success: "Flow shared" }, { status: 200 });

    } catch (error) {
        console.error("Error sharing flow:", error);
        return NextResponse.json({ error: "Failed to share flow" }, { status: 500 });
    }
}