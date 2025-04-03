import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import os from 'os';

import { OCRService } from '../../lib/ocr';
import { OpenAIService } from '../../lib/openai';

const ocrService = new OCRService(process.env.MISTRAL_API_KEY || '');
const openaiService = new OpenAIService(process.env.OPENAI_API_KEY || '');

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

        if (file.type !== 'application/pdf') {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload a PDF file' },
                { status: 400 }
            );
        }

        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File size too large. Maximum size is 10MB' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const tempFilename = `upload_${timestamp}_${randomString}.pdf`;
        const tempFilePath = join(os.tmpdir(), tempFilename);

        await writeFile(tempFilePath, buffer);
        console.log('File saved to:', tempFilePath);

        // Process the PDF file with OCR
        const { content: pdfContent, response: ocrResponse } = await ocrService.processFile(tempFilePath, file.name);

        console.log('PDF Content:', pdfContent);
        const audioScript = await openaiService.generatePodcastScript(pdfContent);

        return NextResponse.json({
            message: 'File uploaded successfully',
            fileName: file.name,
            fileSize: file.size,
            tempFilePath: tempFilePath,
            ocrResponse: ocrResponse,
            audioFile: null,
            audioScript: audioScript,
        });

    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}