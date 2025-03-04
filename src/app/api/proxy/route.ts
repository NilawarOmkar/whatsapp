export async function GET() {
    try {
        const response = await fetch("http://45.33.101.184:3000/users");

        if (!response.ok) {
            throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
