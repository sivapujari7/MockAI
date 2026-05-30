const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

async function generateResumeATS(resumeText) {
  const response =
    await client.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324",
      messages: [
        {
          role: "system",
          content: `
Analyze the resume.

Return ONLY valid JSON.

{
  "atsScore":85,
  "skillsFound":["JavaScript","Node.js"],
  "missingSkills":["Docker","AWS"],
  "strengths":["Strong projects"],
  "improvements":["Add measurable achievements"],
  "summary":"Good resume for software engineering."
}
`
        },
        {
          role: "user",
          content: resumeText
        }
      ]
    });

  return JSON.parse(
    response.choices[0].message.content
  );
}

module.exports = {
  generateResumeATS
};