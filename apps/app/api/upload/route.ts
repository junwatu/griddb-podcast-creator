import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import os from 'os';
import fs from 'fs';

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey: apiKey });

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

        const uploaded_file = fs.readFileSync(tempFilePath);
        const uploaded_pdf = await client.files.upload({
            file: {
                fileName: file.name,
                content: uploaded_file,
            },
            purpose: "ocr"
        });

        // get signedURL
        const signedUrl = await client.files.getSignedUrl({
            fileId: uploaded_pdf.id,
        });

        const ocrResponse = await client.ocr.process({
            model: "mistral-ocr-latest",
            document: {
                type: "document_url",
                documentUrl: signedUrl.url,
            }
        });

        console.log('OCR Response:', ocrResponse);

        return NextResponse.json({
            message: 'File uploaded successfully',
            fileName: file.name,
            fileSize: file.size,
            tempFilePath: tempFilePath,
            ocrResponse: ocrResponse
        });

    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}