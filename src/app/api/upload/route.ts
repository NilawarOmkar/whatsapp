import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate environment variables
    const accessToken = process.env.NEXT_PUBLIC_WHATSAPP_API_TOKEN;
    const appId = process.env.META_APP_ID;
    
    if (!accessToken || !appId) {
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    // Get file metadata
    const fileName = file.name;
    const fileType = file.type;
    const fileSize = file.size;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Step 1: Create upload session
    const uploadSessionParams = new URLSearchParams({
      access_token: accessToken,
      file_name: fileName,
      file_length: fileSize.toString(),
      file_type: fileType,
    });

    const sessionResponse = await fetch(
      `https://graph.facebook.com/v22.0/${appId}/uploads?${uploadSessionParams}`,
      { method: 'POST' }
    );

    if (!sessionResponse.ok) {
      const error = await sessionResponse.text();
      return NextResponse.json(
        { error: 'Failed to create upload session', details: error },
        { status: sessionResponse.status }
      );
    }

    const sessionData = await sessionResponse.json();
    const uploadSessionId = sessionData.id.split(':')[1];

    // Step 2: Upload file content
    const uploadResponse = await fetch(
      `https://graph.facebook.com/v22.0/upload:${uploadSessionId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${accessToken}`,
          'file_offset': '0',
          'Content-Type': fileType,
        },
        body: fileBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      return NextResponse.json(
        { error: 'File upload failed', details: error },
        { status: uploadResponse.status }
      );
    }

    const { h: fileHandle } = await uploadResponse.json();
    
    return NextResponse.json({ fileHandle });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}