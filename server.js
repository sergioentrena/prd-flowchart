const express = require('express');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

const REGION = process.env.AWS_REGION || 'us-east-1';
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-opus-4-5-20251101-v1:0';
const bedrock = new BedrockRuntimeClient({ region: REGION });

app.post('/api/generate', async (req, res) => {
  const { system, prompt, max_tokens = 8000 } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens,
      ...(system ? { system } : {}),
      messages: [{ role: 'user', content: prompt }]
    };

    const cmd = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    });

    const response = await bedrock.send(cmd);
    const result = JSON.parse(Buffer.from(response.body).toString('utf8'));
    res.json({ text: result.content[0].text });
  } catch (err) {
    console.error('Bedrock error:', err);
    res.status(500).json({ error: err.message || 'Bedrock call failed' });
  }
});

app.listen(PORT, () => console.log(`prd-flowchart running on http://localhost:${PORT} [model: ${MODEL_ID}]`));
