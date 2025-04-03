import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

interface TalkingPoint {
  content: string;
}

interface PodcastData {
  introduction: string;
  conclusion: string;
  call_to_action: string;
  main_talking_points: TalkingPoint[];
}

interface PodcastOptions {
  model?: string;
  voice?: string;
  instructions?: string;
  outputFormat?: string;
  outputDir?: string;
}

type AudioFiles = {
  [key: string]: string;
};

/**
 * Converts podcast script to speech using OpenAI TTS
 * @param {PodcastData} podcastData - The podcast script data matching the schema
 * @param {string} apiKey - OpenAI API key
 * @param {PodcastOptions} options - Additional options
 * @returns {Promise<AudioFiles>} Object with audio file paths
 */
export async function generatePodcastAudio(
  podcastData: PodcastData,
  apiKey: string,
  options: PodcastOptions = {}
): Promise<AudioFiles> {
  const {
    model = 'gpt-4o-mini-tts',
    voice = 'fable',
    instructions = 'excited and informable podcaster',
    outputFormat = 'mp3',
    outputDir = './audio'
  } = options;

  const openai = new OpenAI({ apiKey });

  // Create output directory if it doesn't exist
  fs.mkdirSync(outputDir, { recursive: true });

  const audioFiles: AudioFiles = {};
  const sections = [
    'introduction',
    'conclusion',
    'call_to_action',
    ...podcastData.main_talking_points
  ];

  for (const [index, section] of sections.entries()) {
    try {
      let text: string;
      let fileName: string;

      if (typeof section === 'string') {
        // Handle string sections (introduction, conclusion, cta)
        text = podcastData[section as keyof Pick<PodcastData, 'introduction' | 'conclusion' | 'call_to_action'>];
        fileName = `${section}.${outputFormat}`;
      } else {
        // Handle talking points
        text = (section as TalkingPoint).content;
        fileName = `talking_point_${index - 2}.${outputFormat}`; // Adjust index for prior sections
      }

      const speechFile = path.join(outputDir, fileName);

      const response = await openai.audio.speech.create({
        model,
        voice,
        instructions,
        input: text
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(speechFile, buffer);

      audioFiles[typeof section === 'string' ? section : `talking_point_${index - 2}`] = speechFile;
    } catch (error) {
      console.error(`Error processing section ${index}:`, error);
      throw error;
    }
  }

  return audioFiles;
}

// Example usage:
/*
const podcastScript = { introduction: "...", main_talking_points: [...] };
const API_KEY = 'your-openai-api-key';

generatePodcastAudio(podcastScript, API_KEY, {
  outputDir: './podcast_audio',
  voice: 'nova',
  outputFormat: 'mp3'
})
  .then(files => console.log('Generated files:', files))
  .catch(err => console.error('Error:', err));
*/