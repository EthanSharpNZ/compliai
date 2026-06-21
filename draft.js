// CompliAI — serverless proxy for AI drafting.
// Runs on Vercel as /api/draft. Your Anthropic API key stays on the server
// (set as the ANTHROPIC_API_KEY environment variable) and never touches the browser.
//
// Docs: https://docs.claude.com/en/api/overview

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  // Vercel parses JSON bodies automatically; guard just in case.
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const prompt = body && body.prompt;
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "missing_prompt" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "server_not_configured" });
    return;
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        // Swap to a cheaper model (e.g. a Haiku model string) to cut cost per draft.
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      // Surface a safe error without leaking key/details.
      res.status(502).json({ error: "upstream_error" });
      return;
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: "draft_failed" });
  }
}
