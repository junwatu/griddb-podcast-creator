import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

interface TalkingPoint {
  title: string;
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

  // Process introduction, conclusion, and call_to_action
  const simpleKeys = ['introduction', 'conclusion', 'call_to_action'] as const;

  for (const key of simpleKeys) {
    try {
      const text = podcastData[key];
      const fileName = `${key}.${outputFormat}`;
      const speechFile = path.join(outputDir, fileName);

      const response = await openai.audio.speech.create({
        model,
        voice,
        instructions,
        input: text
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(speechFile, buffer);

      audioFiles[key] = speechFile;
    } catch (error) {
      console.error(`Error processing ${key}:`, error);
      throw error;
    }
  }

  // Process main talking points separately
  if (Array.isArray(podcastData.main_talking_points)) {
    for (let i = 0; i < podcastData.main_talking_points.length; i++) {
      try {
        const point = podcastData.main_talking_points[i];
        const text = point.content;
        const fileName = `talking_point_${i}.${outputFormat}`;
        const speechFile = path.join(outputDir, fileName);

        const response = await openai.audio.speech.create({
          model,
          voice,
          instructions,
          input: text
        });

        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(speechFile, buffer);

        audioFiles[`talking_point_${i}`] = speechFile;
      } catch (error) {
        console.error(`Error processing talking point ${i}:`, error);
        throw error;
      }
    }
  } else {
    console.warn('main_talking_points is not an array or is undefined');
  }

  return audioFiles;
}