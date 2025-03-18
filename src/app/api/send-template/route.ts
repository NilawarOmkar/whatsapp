import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Received request body:", JSON.stringify(body, null, 2));

        // Validate required fields
        if (!body.messaging_product || body.messaging_product !== "whatsapp") {
            return NextResponse.json({
                error: "Invalid messaging_product",
                details: "messaging_product must be 'whatsapp'"
            }, { status: 400 });
        }

        if (!body.recipient_type || body.recipient_type !== "individual") {
            return NextResponse.json({
                error: "Invalid recipient_type",
                details: "recipient_type must be 'individual'"
            }, { status: 400 });
        }

        if (!body.type || body.type !== "template") {
            return NextResponse.json({
                error: "Invalid message type",
                details: "type must be 'template'"
            }, { status: 400 });
        }

        if (!body.to || !/^\d{10,15}$/.test(body.to)) {
            return NextResponse.json({
                error: "Invalid phone number",
                details: "Phone number must be 10-15 digits"
            }, { status: 400 });
        }

        if (!body.template?.name || !body.template?.language?.code) {
            return NextResponse.json({
                error: "Invalid template configuration",
                details: "template name and language code are required"
            }, { status: 400 });
        }

        const token = process.env.NEXT_PUBLIC_WHATSAPP_API_TOKEN;
        const phoneNumberId = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID;

        if (!token || !phoneNumberId) {
            return NextResponse.json({ error: "Missing API credentials" }, { status: 500 });
        }

        // Ensure components are properly formatted
        if (body.template.components) {
            body.template.components = body.template.components.map((component: any) => {
                if (component.type === 'button' && component.sub_type === 'flow') {
                    return {
                      ...component,
                      parameters: component.parameters.map((param: any) => ({
                        ...param,
                        action: {
                          ...param.action,
                          flow_token: param.action.flow_token || "unused"
                        }
                      }))
                    };
                  }
                // Ensure all component types are lowercase
                component.type = component.type.toLowerCase();
                if (component.sub_type) {
                    component.sub_type = component.sub_type.toLowerCase();
                }

                // Format parameters if they exist
                if (component.parameters) {
                    component.parameters = component.parameters.map((param: any) => {
                        param.type = param.type.toLowerCase();
                        return param;
                    });
                }

                return component;
            });
        }

        const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const responseData = await response.json();
        console.log("WhatsApp API Response:", JSON.stringify(responseData, null, 2));

        if (!response.ok) {
            console.error("WhatsApp API Error:", responseData);
            return NextResponse.json({
                error: "Failed to send WhatsApp message",
                details: responseData
            }, { status: response.status });
        }

        return NextResponse.json({ success: true, data: responseData });
    } catch (error) {
        console.error("Error in send-template API:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
