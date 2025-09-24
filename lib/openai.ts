import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPEN_AI_KEY,
});

const askToGPT = async (model: string, input: string): Promise<string> => {
  const response = await client.responses.create({
    model,
    input,
  });

  return response.output_text;
};

export { askToGPT };
