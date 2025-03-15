import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
        }

        const backendUrl = 'http://66.228.61.181:3000/users/login';
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
