const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

async function generateInterviewResponse(jobRole, answer) {
  const response = await client.chat.completions.create({
    model: "deepseek/deepseek-chat-v3-0324",
    messages: [
      {
        role: "system",
        content: `You are an expert interviewer for ${jobRole}.`
      },
      {
        role: "user",
        content: answer
      }
    ]
  });

  return response.choices[0].message.content;
}

module.exports = {
  generateInterviewResponse
};