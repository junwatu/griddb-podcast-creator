import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import os from 'os';
import fs from 'fs';
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

        const uploaded_file = fs.readFileSync(tempFilePath);
        const uploaded_pdf = await client.files.upload({
            file: {
                fileName: file.name,
                content: uploaded_file,
            },
            purpose: "ocr"
        });

        const signedUrl = await client.files.getSignedUrl({
            fileId: uploaded_pdf.id,
        });

        // Perform OCR
        const ocrResponse = await client.ocr.process({
            model: "mistral-ocr-latest",
            document: {
                type: "document_url",
                documentUrl: signedUrl.url,
            }
        });

        let pdfContent = "";
        for (const page of ocrResponse.pages) {
            pdfContent += page.markdown + "\n";
        }

        console.log('PDF Content:', pdfContent);
        const response = await openai.responses.create({
            model: "gpt-4o-2024-08-06",
            input: [
              {
                "role": "system",
                "content": [
                  {
                    "type": "input_text",
                    "text": "Create a 5-minute podcast episode script in a conversational style, using the content provided.\n\nInclude the following elements:\n\n- **Introduction**: Engage your audience with an intriguing opening statement related to the topic. Capture their attention immediately.\n\n- **Main Talking Points**: Develop 3-4 main sections discussing the central ideas or arguments. Use relatable examples and personal stories for better understanding. Maintain a conversational tone, as if you are speaking directly to the listener. Ensure natural transitions between sections to keep the flow.\n\n- **Conclusion**: Summarize the key takeaways in a concise manner, making sure to leave a lasting impression.\n\n- **Call to Action**: End with a clear and compelling call to action encouraging listeners to engage further or reflect on the topic.\n\n# Output Format\n\nWrite the script in a conversational and engaging narrative suitable for a podcast. Each section should integrate seamlessly with transitions, emulate a direct speaking style to engage the listener, and reinforce the message.\n\n# Examples\n\n**Introduction**: \"Welcome to [Podcast Name]. Today, we're diving into [Topic]. Have you ever wondered...?\"\n\n**Main Talking Points**:\n\n1. \"Let's start with [Main Idea]. It's like when...\"\n2. \"Moving on to [Next Idea], consider how...\"\n3. \"Finally, when we talk about [Final Idea], there's a story about...\"\n\n**Conclusion**: \"So, as we've learned today, [Key Takeaway 1], [Key Takeaway 2]...\"\n\n**Call to Action**: \"Think about how you can [Action]. Join us next time when we explore...\"\n\n# Notes\n\n- The script should be written to cater both to novices and those with some prior knowledge.\n- Ensure it resonates intellectually and stimulates curiosity among listeners.\n- Use transition words to guide listeners smoothly from one idea to the next."
                  }
                ]
              },
              {
                "role": "user",
                "content": [
                  {
                    "type": "input_text",
                    "text": pdfContent
                  }
                ]
              },       
            ],
            text: {
              "format": {
                "type": "json_schema",
                "name": "podcast_episode_script",
                "strict": true,
                "schema": {
                  "type": "object",
                  "properties": {
                    "introduction": {
                      "type": "string",
                      "description": "Engaging opening statement to capture the audience's attention."
                    },
                    "main_talking_points": {
                      "type": "array",
                      "description": "Sections discussing the central ideas or arguments.",
                      "items": {
                        "type": "object",
                        "properties": {
                          "title": {
                            "type": "string",
                            "description": "The title of the main talking point."
                          },
                          "content": {
                            "type": "string",
                            "description": "The narrative content of the talking point."
                          }
                        },
                        "required": [
                          "title",
                          "content"
                        ],
                        "additionalProperties": false
                      }
                    },
                    "conclusion": {
                      "type": "string",
                      "description": "Summary of the key takeaways from the episode."
                    },
                    "call_to_action": {
                      "type": "string",
                      "description": "A clear and compelling call to action for the audience."
                    }
                  },
                  "required": [
                    "introduction",
                    "main_talking_points",
                    "conclusion",
                    "call_to_action"
                  ],
                  "additionalProperties": false
                }
              }
            },
            reasoning: {},
            tools: [],
            temperature: 1,
            max_output_tokens: 2048,
            top_p: 1,
            store: true
          });

        // ignore this error
        // @ts-ignore
        console.log('Response:', response.output[0]?.content[0].text);

        return NextResponse.json({
            message: 'File uploaded successfully',
            fileName: file.name,
            fileSize: file.size,
            tempFilePath: tempFilePath,
            ocrResponse: ocrResponse,
            audioFile: null,
            audioScript: null,
        });

    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}