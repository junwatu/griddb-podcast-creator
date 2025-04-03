import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import os from 'os';

import { OCRService } from '../../lib/ocr';
import { OpenAIService } from '../../lib/openai';
import { generatePodcastAudio } from '@/app/lib/aiaduio';

const ocrService = new OCRService(process.env.MISTRAL_API_KEY || '');
const openaiService = new OpenAIService(process.env.OPENAI_API_KEY || '');
const audioDir = './../public/audio';
const instructions = `**Voice:** Warm, charismatic, and deeply engaging—like a storyteller by a crackling campfire, pulling you in with every word.  

**Tone:** Confident yet approachable, striking a balance between authority and friendliness, making complex topics feel simple and intriguing.  

**Speech Mannerisms:** Uses vivid imagery, rhetorical questions, and the occasional well-placed pause to build anticipation. Naturally conversational, with a touch of humor and enthusiasm to keep listeners hooked.  

**Pronunciation:** Clear and expressive, with subtle inflections that emphasize key points. Words are articulated with precision but never feel rigid or overly polished.  

**Tempo:** Moderately paced, adjusting fluidly based on the topic—slowing down for emphasis, speeding up for excitement, ensuring a dynamic and engaging listening experience.`

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
        const audioFiles = await generatePodcastAudio(audioScript, process.env.OPENAI_API_KEY || '', {
            voice: 'alloy',
            outputDir: audioDir,
            instructions: instructions,
            outputFormat: 'mp3',
        });

        console.log('Audio Files:', audioFiles);
        
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