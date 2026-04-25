require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk').default;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve built static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

app.post('/api/analyze-esg', async (req, res) => {
  const { title, description, sector, gtmModel, values } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: 'ANTHROPIC_API_KEY not configured. Add it to .env file.',
    });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are an ESG (Environmental, Social, Governance) expert specialising in digital product sustainability for European technology companies.

Analyse the following product feature for its ESG impact and provide scores from 1 to 10 for each ESG pillar.

FEATURE TITLE: ${title}

FEATURE DESCRIPTION: ${description || 'No description provided.'}

COMPANY CONTEXT:
- Sector: ${sector}
- GTM Model: ${gtmModel}
- Company Values: ${values && values.length > 0 ? values.join(', ') : 'Not specified'}

SCORING GUIDE:
- 1–3: Negative or negligible positive ESG impact
- 4–5: Neutral to low positive impact
- 6–7: Moderate positive ESG impact
- 8–9: Strong positive ESG impact
- 10: Exceptional, sector-leading ESG contribution

Return ONLY a valid JSON object in this exact format (no markdown, no extra text):
{
  "environmental": {
    "score": <integer 1-10>,
    "reasoning": "<1-2 sentence explanation of the environmental impact>"
  },
  "social": {
    "score": <integer 1-10>,
    "reasoning": "<1-2 sentence explanation of the social impact>"
  },
  "governance": {
    "score": <integer 1-10>,
    "reasoning": "<1-2 sentence explanation of the governance impact>"
  },
  "summary": "<2-3 sentence overall ESG assessment of this feature>",
  "recommendations": [
    "<specific actionable ESG improvement recommendation>",
    "<specific actionable ESG improvement recommendation>"
  ]
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and clamp scores
    const clamp = (v) => Math.max(1, Math.min(10, Math.round(Number(v) || 5)));
    result.environmental.score = clamp(result.environmental.score);
    result.social.score = clamp(result.social.score);
    result.governance.score = clamp(result.governance.score);
    result.recommendations = Array.isArray(result.recommendations) ? result.recommendations.slice(0, 3) : [];

    return res.json(result);
  } catch (err) {
    console.error('ESG analysis error:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
  });
});

// Catch-all for SPA in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Sotari API server running on http://localhost:${PORT}`);
  console.log(`Anthropic API: ${process.env.ANTHROPIC_API_KEY ? '✓ Configured' : '✗ Not configured (add to .env)'}`);
});
