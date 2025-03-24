// import { NextResponse } from "next/server";

// const PHONE_NUMBER_ID = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID;
// const ACCESS_TOKEN = process.env.NEXT_PUBLIC_WHATSAPP_API_TOKEN;

// export async function POST(req: Request) {
//     try {
//         // const { numbers, message } = await req.json();
//         const numbers = [919370435262, 918745813705, 919719321451, 12012189440, 16464609200, 12012189436, 12162626123];
//         const message = "Testing from batch api";

//         if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
//             return NextResponse.json({ error: "Invalid numbers array" }, { status: 400 });
//         }

//         if (!message) {
//             return NextResponse.json({ error: "Message is required" }, { status: 400 });
//         }

//         const batch = numbers.map((number) => ({
//             method: "POST",
//             relative_url: `${PHONE_NUMBER_ID}/messages`,
//             body: `messaging_product=whatsapp&to=${number}&type=text&text={"body":"${message}"}`,
//         }));

//         const response = await fetch(`https://graph.facebook.com/me?access_token=${ACCESS_TOKEN}`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ batch, include_headers: false }),
//         });

//         const data = await response.json();
//         return NextResponse.json(data);
//     } catch (error) {
//         console.error("Error sending WhatsApp messages:", error);
//         return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//     }
// }
