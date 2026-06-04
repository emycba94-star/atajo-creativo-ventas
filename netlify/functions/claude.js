exports.handler = async function(event, context) {
    const CORS = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

    try {
          const { prompt, action } = JSON.parse(event.body || '{}');
          if (!prompt) return {
                  statusCode: 400,
                  headers: { ...CORS, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ error: 'prompt requerido' })
          };

      const apiKey = process.env.ANTHROPIC_API_KEY;
          if (!apiKey) return {
                  statusCode: 500,
                  headers: { ...CORS, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ error: 'API key no configurada' })
          };

      // Token optimization: rewrite uses fewer tokens than full generation
      const maxTokens = action === 'rewrite' ? 400 : action === 'coach' ? 300 : 800;

      // System prompt with rubro intelligence
      const systemPrompt = `Sos un experto en ventas por WhatsApp y videollamada para negocios latinoamericanos.
      Tu trabajo: escribir mensajes de venta REALES, directos, que suenen humanos y cierren negocios.

      RUBROS con expertise especifico:
      - ESTETICA/CLINICA/ODONTOLOGIA: urgencia de salud, resultados visibles, confianza profesional
      - INMOBILIARIA: inversion a largo plazo, seguridad familiar, exclusividad de oportunidad
      - CONSULTORIA/MARKETING: ROI medible, casos de exito, diferenciacion competitiva
      - COACH/EDUCACION: transformacion personal, resultados concretos, comunidad
      - RETAIL/ECOMMERCE: escasez, precio, beneficio inmediato
      - SERVICIOS GENERALES: confianza, rapidez, garantia

      REGLAS DE ORO:
      1. Maximo 3 opciones por mensaje - el cliente elige, no se abruma
      2. Sin jerga de ventas obvia - suenan a personas reales
      3. Siempre hay un siguiente paso claro al final
      4. Adapta el tono exacto que pidio el usuario
      5. Para videollamada: incluye apertura, desarrollo y cierre con manejo de silencios
      6. Responde SOLO el contenido pedido, sin explicaciones extra ni meta-comentarios`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
              },
              body: JSON.stringify({
                        model: 'claude-haiku-4-5',
                        max_tokens: maxTokens,
                        system: systemPrompt,
                        messages: [{ role: 'user', content: prompt }]
              })
      });

      if (!response.ok) {
              const errText = await response.text();
              return {
                        statusCode: response.status,
                        headers: { ...CORS, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ error: 'API Error: ' + errText.substring(0, 200) })
              };
      }

      const data = await response.json();
          const text = data.content?.[0]?.text || '';
          return {
                  statusCode: 200,
                  headers: { ...CORS, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ result: text })
          };

    } catch (err) {
          return {
                  statusCode: 500,
                  headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                  body: JSON.stringify({ error: err.message })
          };
    }
};
