import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF file' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Create a unique temporary file path
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate a unique filename using timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const tempFilename = `upload_${timestamp}_${randomString}.pdf`;
    const tempFilePath = join(os.tmpdir(), tempFilename);
    
    // Save the file to temp directory
    await writeFile(tempFilePath, buffer);

    console.log('File saved to:', tempFilePath);
    
    return NextResponse.json({
      message: 'File uploaded successfully',
      fileName: file.name,
      fileSize: file.size,
      tempFilePath: tempFilePath
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}