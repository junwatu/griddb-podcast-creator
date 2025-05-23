import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import os from 'os';

import { OCRService } from '../../lib/ocr';
import { OpenAIService } from '../../lib/openai';
import { generatePodcastAudio } from '@/app/lib/aiaduio';
import { createGridDBClient } from '../../lib/griddb';
import { generateRandomID } from "../../lib/randomId";
import { GridDBConfig, GridDBData } from '@/app/lib/types/griddb.types';

const ocrService = new OCRService(process.env.MISTRAL_API_KEY || '');
const openaiService = new OpenAIService(process.env.OPENAI_API_KEY || '');
const audioDir = join(process.cwd(), 'public', 'audio');
const instructions = `**Voice:** Warm, charismatic, and deeply engaging—like a storyteller by a crackling campfire, pulling you in with every word.  

**Tone:** Confident yet approachable, striking a balance between authority and friendliness, making complex topics feel simple and intriguing.  

**Speech Mannerisms:** Uses vivid imagery, rhetorical questions, and the occasional well-placed pause to build anticipation. Naturally conversational, with a touch of humor and enthusiasm to keep listeners hooked.  

**Pronunciation:** Clear and expressive, with subtle inflections that emphasize key points. Words are articulated with precision but never feel rigid or overly polished.  

**Tempo:** Moderately paced, adjusting fluidly based on the topic—slowing down for emphasis, speeding up for excitement, ensuring a dynamic and engaging listening experience.`

const dbConfig: GridDBConfig = {
    griddbWebApiUrl: process.env.GRIDDB_WEBAPI_URL || '',
    username: process.env.GRIDDB_USERNAME || '',
    password: process.env.GRIDDB_PASSWORD || '',
}

const dbClient = createGridDBClient(dbConfig);
dbClient.createContainer();

function cleanAudioPaths(audioFiles: Record<string, string>): Record<string, string> {
    const cleaned: Record<string, string> = {};
    for (const [key, path] of Object.entries(audioFiles)) {
        // Convert absolute paths to relative URLs
        cleaned[key] = path.replace(/^.*\/public/, '');
    }
    return cleaned;
}

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

        //console.log('PDF Content:', pdfContent);
        const audioScript = await openaiService.generatePodcastScript(pdfContent);
        console.log('Audio Script:', audioScript);

        /** enable this for production, it will cost you money */
        const audioFiles = await generatePodcastAudio(audioScript, process.env.OPENAI_API_KEY || '', {
            voice: 'verse',
            outputDir: audioDir,
            instructions: instructions,
            outputFormat: 'mp3',
        });

        // Clean the audio file paths
        const cleanedAudioFiles = cleanAudioPaths(audioFiles);
        console.log('Cleaned Audio Files:', cleanedAudioFiles);

        /** 
        const dummyAudioFiles = 
        {
            introduction: '/audio/introduction.mp3',
            conclusion: '/audio/conclusion.mp3',
            call_to_action: '/audio/call_to_action.mp3',
            talking_point_0: '/audio/talking_point_0.mp3',
            talking_point_1: '/audio/talking_point_1.mp3',
            talking_point_2: '/audio/talking_point_2.mp3',
            talking_point_3: '/audio/talking_point_3.mp3'
          }
        */

        /** Save the data into GridDB database */
        const podcastData: GridDBData = {
            id: generateRandomID(),
            // use dummy audio files for now
            audioFiles: JSON.stringify(cleanedAudioFiles),
            audioScript: JSON.stringify(audioScript),
            // ts ignore
            // @ts-ignore
            ocrResponse: JSON.stringify(ocrResponse)
        }

        const result = await dbClient.insertData({ data: podcastData });
        console.log('GridDB Insert Result:', result);

        return NextResponse.json({
            message: 'File uploaded successfully',
            fileName: file.name,
            fileSize: file.size,
            tempFilePath: tempFilePath,
            ocrResponse: ocrResponse,
            audioFiles: audioFiles,
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