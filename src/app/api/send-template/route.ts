import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { name, category, language, number, components } = await req.json();

        if (!name || !language || !number || !components) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const token = process.env.NEXT_PUBLIC_WHATSAPP_API_TOKEN;
        const phoneNumberId = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID;

        if (!token || !phoneNumberId) {
            return NextResponse.json({ error: "Missing API credentials" }, { status: 500 });
        }

        const body = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: number,
            type: "template",
            template: {
                name: name,
                language: { code: language },
                components: components
            }
        };

        console.log("Sending Template:", body);

        const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("WhatsApp API Error:", errorData);
            return NextResponse.json({ error: "Failed to send WhatsApp message", details: errorData }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in send-template API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
