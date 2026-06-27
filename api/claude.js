// Build: 2026-06-27T03:11:23.599Z
// api/claude.js — Vercel Serverless Function
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API key not configured" });

    let messages;
    let systemPrompt;

    // MODE 1: Coach de Ventas (conversacion multi-turno)
    if (body.coach && Array.isArray(body.messages)) {
      systemPrompt = `Sos un Coach de Ventas profesional con 10 anos de experiencia. 
Sos experto en: cierre de ventas, manejo de objeciones, persuasion, seguimiento de leads, 
SPIN Selling, metodo Sandler, tecnicas de Cialdini, ventas consultivas, copywriting para WhatsApp.
Respondas cualquier pregunta del usuario sobre ventas, negociacion, marketing, clientes difciles, 
como responder mensajes, como hacer seguimiento, como cerrar, como manejar el precio, etc.
Hablas en español rioplatense. Sos directo, practico y das ejemplos concretos listos para usar.
Maximo 3 parrafos por respuesta. Usa emojis ocasionalmente para hacerlo mas amigable.`;
      messages = body.messages;
    }
    // MODE 2: Generacion de sistema/modulo (prompt simple)
    else if (body.prompt) {
      systemPrompt = `Sos un vendedor experto con 10 anos de experiencia en cualquier rubro.
Dominas todas las tecnicas de ventas: Cialdini, SPIN Selling, Sandler, ventas consultivas, cierre por alternativas.
Hablas en español rioplatense, directo, concreto y sin rodeos.
Generas sistemas de ventas por WhatsApp ultra-personalizados y accionables.
Cada respuesta debe ser lista para usar: copiar y pegar directamente en WhatsApp.`;
      messages = [{ role: "user", content: body.prompt }];
    }
    else {
      return res.status(400).json({ error: "Se requiere 'prompt' o 'messages' en el body" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 2000,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return res.status(response.status).json({ error: "API error", detail: errText });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    return res.status(200).json({ result: text, module: body.module, action: body.action });

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};
