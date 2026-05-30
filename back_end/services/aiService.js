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
        content: `You are an expert interviewer for ${jobRole}. Ask realistic interview questions and follow-ups.`
      },
      {
        role: "user",
        content: answer
      }
    ]
  });

  return response.choices[0].message.content;
}

async function generateInterviewFeedback(jobRole, answer) {
  const response = await client.chat.completions.create({
    model: "deepseek/deepseek-chat-v3-0324",
    messages: [
      {
        role: "system",
        content: `
Evaluate interview answers.

Return ONLY valid JSON:

{
  "confidenceScore":85,
  "communicationScore":80,
  "technicalScore":90,
  "strengths":["item1","item2"],
  "improvements":["item1","item2"],
  "summary":"short summary"
}
`
      },
      {
        role: "user",
        content: `
Role: ${jobRole}

Answer:
${answer}
`
      }
    ]
  });

  return response.choices[0].message.content;
}

module.exports = {
  generateInterviewResponse,
  generateInterviewFeedback
};