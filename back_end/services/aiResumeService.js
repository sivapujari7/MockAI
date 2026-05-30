const OpenAI = require('openai');

const AI_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324';
let client;

function createServiceError(message) {
  const error = new Error(message);
  error.statusCode = 503;
  return error;
}

function getClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw createServiceError('AI service is not configured. Add OPENROUTER_API_KEY on the backend or in Vercel environment variables.');
  }

  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.CLIENT_URL || process.env.VERCEL_URL || 'http://localhost:5001',
        'X-Title': 'MockAI Resume Analysis',
      },
    });
  }

  return client;
}

function parseJsonObject(raw) {
  const text = String(raw || '').trim();

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw createServiceError('AI resume analysis was not valid JSON. Please try again.');
    return JSON.parse(match[0]);
  }
}

function normalizeScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean).slice(0, 8);
}

async function generateResumeATS(resumeText, targetRole = 'Software Engineer') {
  if (!String(resumeText || '').trim()) {
    throw createServiceError('Could not read text from the uploaded resume.');
  }

  const response = await getClient().chat.completions.create({
    model: AI_MODEL,
    temperature: 0.25,
    max_tokens: 700,
    messages: [
      {
        role: 'system',
        content: `Analyze resumes for students and freshers applying to jobs.
Return ONLY valid JSON:
{
  "atsScore": 85,
  "skillsFound": ["JavaScript", "Node.js"],
  "missingSkills": ["Docker", "AWS"],
  "strengths": ["Strong projects"],
  "improvements": ["Add measurable achievements"],
  "summary": "Good resume for software engineering."
}`,
      },
      {
        role: 'user',
        content: [
          `Target role: ${targetRole}`,
          '',
          'Resume text:',
          String(resumeText).slice(0, 12000),
        ].join('\n'),
      },
    ],
  });

  const analysis = parseJsonObject(response?.choices?.[0]?.message?.content);

  return {
    atsScore: normalizeScore(analysis.atsScore),
    skillsFound: normalizeArray(analysis.skillsFound),
    missingSkills: normalizeArray(analysis.missingSkills),
    strengths: normalizeArray(analysis.strengths),
    improvements: normalizeArray(analysis.improvements),
    summary: String(analysis.summary || 'Resume analysis complete.'),
  };
}

module.exports = {
  generateResumeATS,
};
