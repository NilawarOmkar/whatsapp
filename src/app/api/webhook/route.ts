import { NextRequest, NextResponse } from "next/server";
import { readExcel } from "@/lib/readExcel";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_API_TOKEN = process.env.NEXT_PUBLIC_WHATSAPP_API_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID;
let userStates: { [key: string]: string } = {};
function log(message: string, emoji = '📄') {
    const timestamp = new Date().toISOString();
    console.log(`${emoji} [${timestamp}] ${message}`);
}

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        log("Webhook verified successfully", '✅');
        return new NextResponse(challenge, { status: 200 });
    } else {
        log("Webhook verification failed", '❌');
        return new NextResponse("Forbidden", { status: 403 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const entry = body.entry?.[0];

        if (entry) {
            const changes = entry.changes?.[0];
            if (changes) {
                // Handle incoming messages
                if (changes.value.messages) {
                    const message = changes.value.messages[0];
                    const from = message.from;

                    log(`Received ${message.type} message from: ${from}`, '📩');

                    if (message.type === "text") {
                        if (userStates[from] === "awaiting_order_id") {
                            const orderId = message.text.body;
                            await sendShippingStatus(from, orderId);
                            userStates[from] = "";
                        } else {
                            if (/^hi$/i.test(message.text.body.trim())) {
                                await sendMainMenu(from);
                            } else {
                                await storeMessageInRabbitMQ(from, message.text.body);
                            }
                        }
                    }

                    if (["image", "document", "audio", "video", "sticker"].includes(message.type)) {
                        const media = message[message.type];
                    }

                    if (message.type === "interactive") {
                        const interaction = message.interactive;
                        if (interaction.type === "list_reply") {
                            const selected = interaction.list_reply;
                            log(`${from} selected menu option: ${selected.title}`, '🔘');

                            switch (selected.id) {
                                case "inventory_row":
                                    await sendCatalogMessage(from);
                                    break;
                                case "shipping_row":
                                    await requestOrderNumber(from);
                                    userStates[from] = "awaiting_order_id";
                                    break;
                                case "notifications_row":
                                    await handleNotificationOptIn(from);
                                    break;
                                case "unsubscribe_row":
                                    console.log("Trying to unsubscribe ", from)
                                    await unsubscribeUser(from);
                                    break;
                            }
                        }
                        else if (interaction.type === "nfm_reply") {
                            try {
                                const flowResponse = JSON.parse(interaction.nfm_reply.response_json);
                                console.log(flowResponse);
                                if (flowResponse.flow_token === "unused") {
                                    flowResponse.flow_token = from;
                                    await fetch(`http://66.228.61.181:3000/users`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify(flowResponse)
                                    });
                                }
                                else {
                                    await fetch("http://66.228.61.181:3000/rabbitmq/send", {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            ...flowResponse,
                                            phone_number: from
                                        })
                                    })
                                }
                            } catch (error: any) {
                                log(`Form processing failed for ${from}: ${error.message}`, '❌');
                            }
                        }
                    }
                }

                // message status updates
                if (changes.value.statuses) {
                    const statuses = changes.value.statuses;
                    for (const status of statuses) {
                        if (status.status === "failed") {
                            log(`❌ Message ${status.id} failed for ${status.recipient_id}. Full response: ${JSON.stringify(status, null, 2)}`, '📊');
                        } else {
                            log(`✅ Message ${status.id} status: ${status.status} for ${status.recipient_id}`, '📊');
                        }
                    }
                }

            }
        }
        return new NextResponse("EVENT_RECEIVED", { status: 200 });
    } catch (error: any) {
        log(`Critical error: ${error.message}`, '🚨');
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

async function sendCatalogMessage(to: string) {
    try {
        log(`Sending product catalog to ${to}`, '📋');
        const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
        const products: { Grade: string; Model: string; Storage: string; Price: number }[] = await fetch("http://66.228.61.181:3000/products/products").then(res => res.json());

        const productsData: { [key: string]: string[] } = products.reduce((acc: { [key: string]: string[] }, product) => {
            const { Grade, Model, Storage, Price } = product;
            if (!acc[Grade]) {
                acc[Grade] = [];
            }
            acc[Grade].push(`- ${Model} (${Storage}) - $${Price}`);
            return acc;
        }, {});

        const messageBody = Object.entries(productsData)
            .sort(([gradeA], [gradeB]) => gradeA.localeCompare(gradeB))
            .map(([grade, items]) => `*Grade ${grade}*\n${(items as string[]).join("\n")}`)
            .join("\n\n");

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "text",
                text: {
                    preview_url: false,
                    body: messageBody
                },
            }),
        });

        const responseData = await response.json();
        if (!response.ok) {
            log(`Catalog send failed to ${to}: ${responseData.error?.message}`, '❌');
            throw new Error(responseData.error?.message);
        }

        log(`Catalog sent successfully to ${to}`, '✅');

        return responseData;
    } catch (error: any) {
        log(`Catalog send error to ${to}: ${error.message}`, '❌');
        throw error;
    }
}

async function sendShippingUpdate(to: string) {
    try {
        log(`Requesting order number from ${to}`, '🚚');
        const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "text",
                text: { body: "Please enter your order number to check shipping status:" }
            }),
        });

        const responseData = await response.json();
        if (!response.ok) {
            log(`Shipping update failed to ${to}: ${responseData.error?.message}`, '❌');
            throw new Error(responseData.error?.message);
        }

        log(`Shipping update sent to ${to}`, '✅');

        return responseData;
    } catch (error: any) {
        log(`Shipping update error to ${to}: ${error.message}`, '❌');
        throw error;
    }
}

const handleNotificationOptIn = async (phone: string) => {
    try {
        const payload = {
            messaging_product: "whatsapp",
            to: phone,
            type: "template",
            template: {
                name: "form",
                language: {
                    code: "en_US",
                },
                components: [
                    {
                        type: "header",
                        parameters: [
                            {
                                type: "image",
                                image: {
                                    id: "28418804584401992",
                                },
                            },
                        ],
                    },
                    {
                        type: "button",
                        sub_type: "flow",
                        index: "0",
                    },
                ],
            },
        };

        const response = await fetch(
            `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
                },
                body: JSON.stringify(payload),
            }
        );

        const data = await response.json();
        console.log(response);

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error.message },
                { status: response.status }
            );
        }

        return NextResponse.json({ success: "Template message sent" });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

async function sendMainMenu(to: string) {
    try {
        log(`Sending main menu to ${to}`, '📜');

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "interactive",
            interactive: {
                type: "list",
                header: {
                    type: "text",
                    text: "Square Group"
                },
                body: {
                    text: "Please select an option from the list:"
                },
                footer: {
                    text: "Click on product for more information"
                },
                action: {
                    button: "Main Menu",
                    sections: [
                        {
                            title: "Our Products",
                            rows: [
                                {
                                    id: "inventory_row",
                                    title: "📦 Available Inventory",
                                },
                                {
                                    id: "shipping_row",
                                    title: "🚚 Shipping Status",
                                },
                                {
                                    id: "notifications_row",
                                    title: "📢 Subscribe Broadcasts",
                                },
                                {
                                    id: "unsubscribe_row",
                                    title: "🚫 Unsubscribe Broadcasts",
                                }
                            ]
                        }
                    ]
                }
            }
        };

        const response = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();

        if (!response.ok) {
            log(`Main menu send failed to ${to}: ${responseData.error?.message}`, '❌');
            log(`Response data: ${JSON.stringify(responseData)}`, '❌');
            throw new Error(responseData.error?.message);
        }

        log(`Main menu sent successfully to ${to}`, '✅');
        return responseData;
    } catch (error: any) {
        log(`Main menu send error to ${to}: ${error.message}`, '❌');
        throw error;
    }
}

async function requestOrderNumber(to: string) {
    try {
        log(`Requesting order number from ${to}`, '🚚');
        const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "text",
                text: { body: "Please enter your order number to check shipping status:" }
            }),
        });

        const responseData = await response.json();
        if (!response.ok) {
            log(`Order number request failed to ${to}: ${responseData.error?.message}`, '❌');
            throw new Error(responseData.error?.message);
        }

        log(`Order number request sent to ${to}`, '✅');
        return responseData;
    } catch (error: any) {
        log(`Order number request error to ${to}: ${error.message}`, '❌');
        throw error;
    }
}

async function sendShippingStatus(to: string, orderId: string) {
    try {
        log(`Sending shipping status for order ${orderId} to ${to}`, '🚚');
        const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "text",
                text: { body: `Your order ${orderId} has been Shipped` }
            }),
        });

        const responseData = await response.json();
        if (!response.ok) {
            log(`Shipping status send failed to ${to}: ${responseData.error?.message}`, '❌');
            throw new Error(responseData.error?.message);
        }

        log(`Shipping status sent to ${to}`, '✅');
        return responseData;
    } catch (error: any) {
        log(`Shipping status error to ${to}: ${error.message}`, '❌');
        throw error;
    }
}

async function unsubscribeUser(flowToken: string) {
    try {
        log(`Unsubscribing user with flow token ${flowToken}`, '🚫');

        const response = await fetch(`http://66.228.61.181:3000/users/${flowToken}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const responseData = await response.json();

        if (!response.ok) {
            log(`Unsubscribe failed for flow token ${flowToken}: ${responseData.error?.message}`, '❌');
            throw new Error(responseData.error?.message);
        }

        log(`User with flow token ${flowToken} unsubscribed successfully`, '✅');
        return responseData;
    } catch (error: any) {
        log(`Unsubscribe error for flow token ${flowToken}: ${error.message}`, '❌');
        throw error;
    }
}

async function storeMessageInRabbitMQ(phone: string, message: string) {
    try {
        log(`Storing message from ${phone} in RabbitMQ: ${message}`, '🐇');
        const response = await fetch("http://localhost:3001/rabbitmq/replies", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone_number: phone,
                message: message,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        log(`Message stored successfully for ${phone}`, '✅');
    } catch (error: any) {
        log(`Failed to store message for ${phone}: ${error.message}`, '❌');
    }
}
