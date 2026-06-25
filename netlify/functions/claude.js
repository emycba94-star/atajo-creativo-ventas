exports.handler = async function(event, context) {
    const CORS = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

    try {
          const body = JSON.parse(event.body || '{}'); const { prompt, action } = body;
          if (!prompt && !(body && body.coach)) return {
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

      // Coach mode: support multi-turn conversation
      const isCoach = body && body.coach === true;
      const coachMessages = (body && body.messages) ? body.messages : null;

      // System prompts
      const generationPrompt = `Sos un experto en ventas por WhatsApp y videollamada para negocios latinoamericanos.
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
      5. Responde SOLO el contenido pedido, sin explicaciones extra`;

      const coachPrompt = `Sos un vendedor profesional con 10 anios de experiencia en todos los rubros del mercado latinoamericano. Tu nombre interno es "Coach de Ventas IA".

      TU EXPERTISE:
      - Psicologia del comprador: sabes exactamente por que la gente compra y por que no
      - Cierre de ventas: 7 tecnicas (escasez, alternativa, asuncion, urgencia, beneficio, pregunta, silencio)
      - Manejo de objeciones: "es caro", "lo tengo que pensar", "no es el momento", "lo veo con mi socio" - tenes respuesta perfecta para todo
      - Persuasion: principios de Cialdini aplicados a ventas reales (reciprocidad, escasez, autoridad, consistencia, agrado, consenso social)
      - WhatsApp como canal: timing, longitud ideal, uso estrategico de emojis, cuando llamar vs escribir
      - Seguimiento sin molestar: la tecnica del valor antes de vender
      - Defensa de precio: como sostener tu precio sin desesperarte ni ceder sin razon
      - Prospeccion: como calificar leads y no perder tiempo con quien no va a comprar
      - Lenguaje de ventas: las palabras que abren y las que cierran conversaciones

      TU ESTILO:
      - Directo y practico: das respuestas concretas, no teorias vagas
      - Cuando piden un script o mensaje: lo das COMPLETO, listo para copiar y pegar
      - Sos como el mentor senior que ya lo vio todo y ayuda sin vueltas
      - Usas espaniol latinoamericano natural (vos, sos, tenes, podes)
      - Longitud justa: corto para preguntas simples, completo para casos complejos
      - Nunca dices que sos una IA ni que no puedes hacer algo - simplemente ayudas`;

      const systemPrompt = isCoach ? coachPrompt : generationPrompt;
      const apiMessages = isCoach && coachMessages ? coachMessages : [{ role: 'user', content: prompt }];

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
                        messages: apiMessages
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
