import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "http://74.207.235.105:3000/groups/";

export async function PUT(req: NextRequest, context: any) {
    const params = await context.params; // Await the params object
    const { id } = params;

    if (!id) {
        return NextResponse.json({ error: "Group ID is required in the URL" }, { status: 400 });
    }

    try {
        const body = await req.json();
        const response = await fetch(`${API_BASE_URL}${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.message || "Failed to update group" }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in PUT proxy:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: any) {
    const params = await context.params; // Await the params object
    const { id } = params;

    if (!id) {
        return NextResponse.json({ error: "Group ID is required in the URL" }, { status: 400 });
    }

    try {
        const response = await fetch(`${API_BASE_URL}${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const data = await response.json();
            return NextResponse.json({ error: data.message || "Failed to delete group" }, { status: response.status });
        }

        return NextResponse.json({ message: "Group deleted successfully" });
    } catch (error) {
        console.error("Error in DELETE proxy:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}