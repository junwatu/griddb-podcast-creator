import { Mistral } from '@mistralai/mistralai';
import fs from 'fs';

export interface OCRResponse {
    pages: Array<{
        markdown: string;
    }>;
}

export class OCRService {
    private client: Mistral;

    constructor(apiKey: string) {
        this.client = new Mistral({ apiKey });
    }

    async processFile(filePath: string, fileName: string): Promise<{ content: string, response: OCRResponse }> {
        try {
            // Read the file
            const file = fs.readFileSync(filePath);

            // Upload file to Mistral
            const uploaded_pdf = await this.client.files.upload({
                file: {
                    fileName: fileName,
                    content: file,
                },
                purpose: "ocr"
            });

            // Get signed URL
            const signedUrl = await this.client.files.getSignedUrl({
                fileId: uploaded_pdf.id,
            });

            // Perform OCR
            const ocrResponse = await this.client.ocr.process({
                model: "mistral-ocr-latest",
                document: {
                    type: "document_url",
                    documentUrl: signedUrl.url,
                }
            });

            // Extract content
            let pdfContent = "";
            for (const page of ocrResponse.pages) {
                pdfContent += page.markdown + "\n";
            }

            return {
                content: pdfContent,
                response: ocrResponse
            };
        } catch (error) {
            console.error('Error processing file with OCR:', error);
            throw error;
        }
    }
}