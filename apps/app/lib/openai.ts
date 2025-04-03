import OpenAI from "openai";

export interface PodcastScript {
    introduction: string;
    main_talking_points: Array<{
        title: string;
        content: string;
    }>;
    conclusion: string;
    call_to_action: string;
}

export class OpenAIService {
    private client: OpenAI;

    constructor(apiKey: string) {
        this.client = new OpenAI({
            apiKey: apiKey
        });
    }

    async generatePodcastScript(content: string): Promise<PodcastScript> {
        try {
            const response = await this.client.responses.create({
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
                                "text": content
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

            // @ts-ignore
            return response.output[0]?.content[0].text;
        } catch (error) {
            console.error('Error generating podcast script:', error);
            throw error;
        }
    }
}