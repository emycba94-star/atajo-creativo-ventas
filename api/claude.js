// api/claude.js — Vercel Serverless Function
// Compatible con Vercel (convierte desde netlify/functions/claude.js)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, module: moduleName, action } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    // System prompt — vendedor experto 10 años
    const systemPrompt = `Sos un vendedor con 10 años de experiencia en cualquier rubro.
Dominás todas las técnicas de ventas: Cialdini (reciprocidad, escasez, autoridad, consistencia, simpatía, consenso),
SPIN Selling, método Sandler, ventas consultivas, cierre por alternativas, manejo de objeciones.
Hablás en español rioplatense, directo, concreto y sin rodeos.
Generás sistemas de ventas por WhatsApp ultra-personalizados y accionables.
Cada respuesta debe ser lista para usar: copiar y pegar directamente en WhatsApp.`,

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return res.status(response.status).json({ error: "API error", detail: errText });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    return res.status(200).json({ result: text, module: moduleName, action });

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
