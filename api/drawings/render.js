import { createClient } from '@supabase/supabase-js';
import { fal } from '@fal-ai/client';
fal.config({ credentials: process.env.FAL_KEY });

if (!process.env.FAL_KEY) {
  console.error('❌ FAL_KEY mancante nel file .env');
}

async function checkBetaAccess(supabase, userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, beta_expires_at')
    .eq('id', userId)
    .single()

  if (!profile) return { allowed: false, reason: 'profilo non trovato' }
  if (profile.role === 'admin') return { allowed: true }

  if (profile.beta_expires_at) {
    const expires = new Date(profile.beta_expires_at)
    if (new Date() > expires) {
      return {
        allowed: false,
        reason: 'Hai raggiunto il limite beta, ci vediamo al lancio! 🚀'
      }
    }
  }

  return { allowed: true, role: profile.role }
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STYLE_CONFIG = {
  cartoon: {
    prompt: "Transform this child's drawing into a high-quality 3D Pixar animated character. Keep exactly the same character, same pose, same proportions. Apply vibrant saturated colors, smooth rounded plastic surfaces, big expressive cartoon eyes, warm studio lighting, clean white background. Pixar Toy Story movie quality.",
    aspect_ratio: "1:1",
    guidance_scale: 4.0,
    safety_tolerance: "2"
  },
  toy: {
    prompt: "Transform this child's drawing into a colorful plastic toy figurine. Keep exactly the same character and pose. Hard shiny plastic material, bright primary colors, clean white background, professional product photography lighting. Collectible toy style.",
    aspect_ratio: "1:1",
    guidance_scale: 3.5,
    safety_tolerance: "2"
  },
  realistic: {
    prompt: "Transform this child's drawing into a photorealistic 3D CGI character. Keep exactly the same character, same pose, same proportions. Cinematic lighting, hyper detailed textures, magical enchanted forest background with soft bokeh. Movie quality VFX.",
    aspect_ratio: "1:1",
    guidance_scale: 4.5,
    safety_tolerance: "2"
  }
};

function toPublicUrl(url, supabaseUrl) {
  if (!url) return null;
  if (url.includes('?token=') || url.includes('/sign/')) {
    const match = url.match(/\/object\/(?:sign|public)\/(.+?)(?:\?|$)/);
    if (match) return `${supabaseUrl}/storage/v1/object/public/${match[1]}`;
  }
  return url;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Non autorizzato' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Token non valido' });

  const betaAccess = await checkBetaAccess(supabase, user.id);
  if (!betaAccess.allowed) return res.status(403).json({ error: betaAccess.reason });

  // Controlla limite render giornaliero (10/giorno per utenti beta)
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  const { data: userDrawings } = await supabase
    .from('drawings')
    .select('id')
    .eq('author_id', user.id);

  const drawingIds = (userDrawings || []).map(d => d.id);

  if (drawingIds.length > 0) {
    const { count: renderOggi } = await supabase
      .from('renders')
      .select('id', { count: 'exact', head: true })
      .in('drawing_id', drawingIds)
      .gte('created_at', oggi.toISOString());

    if (renderOggi >= 10) {
      return res.status(403).json({
        error: 'Hai raggiunto il limite beta, ci vediamo al lancio! 🚀',
        limitReached: 'renders'
      });
    }
  }

  // drawing_id, style — obbligatori sempre
  // refinement_prompt — testo aggiuntivo opzionale
  // refinement_base — 'render' (usa render esistente) | 'drawing' (riparte dal disegno)
  const { drawing_id, style, refinement_prompt, refinement_base } = req.body;

  if (!drawing_id || !style || !['cartoon', 'toy', 'realistic'].includes(style)) {
    return res.status(400).json({ error: 'Parametri mancanti o non validi' });
  }

  const isRefinement = !!refinement_prompt;

  try {
    const { data: drawing, error: drawingError } = await supabase
      .from('drawings')
      .select('id, ai_title, ai_description, ai_prompt_render, processed_url, original_url')
      .eq('id', drawing_id)
      .single();

    if (drawingError || !drawing) {
      return res.status(404).json({ error: 'Disegno non trovato' });
    }

    if (!drawing.ai_prompt_render && !drawing.ai_title) {
      return res.status(400).json({ error: 'Analisi AI non ancora completata.' });
    }

    let imageUrl;

    if (isRefinement && refinement_base === 'render') {
      const { data: existingRender } = await supabase
        .from('renders')
        .select('result_url')
        .eq('drawing_id', drawing_id)
        .eq('style', style)
        .eq('status', 'completed')
        .single();

      if (!existingRender?.result_url) {
        return res.status(400).json({ error: 'Nessun render completato trovato per questo stile.' });
      }
      imageUrl = existingRender.result_url;
      console.log(`✏️ Modalità: MODIFICA RENDER [${style}]`);
    } else {
      imageUrl = toPublicUrl(
        drawing.processed_url || drawing.original_url,
        process.env.VITE_SUPABASE_URL
      );
      console.log(`🎨 Modalità: ${isRefinement ? 'RIGENERA DAL DISEGNO' : 'GENERAZIONE'} [${style}]`);
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'Immagine non trovata.' });
    }

    const { data: existing } = await supabase
      .from('renders')
      .select('id')
      .eq('drawing_id', drawing_id)
      .eq('style', style)
      .single();

    let render;
    if (existing) {
      const { data, error } = await supabase
        .from('renders')
        .update({ status: 'processing' })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      render = data;
    } else {
      const { data, error } = await supabase
        .from('renders')
        .insert({
          drawing_id, style,
          type: 'image',
          status: 'processing',
          provider: 'fal_ai',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      render = data;
    }

    const config = STYLE_CONFIG[style];
    const subject = drawing.ai_prompt_render || drawing.ai_title || '';

    let finalPrompt;
    if (isRefinement && refinement_base === 'render') {
      finalPrompt = `Keep the same character and overall composition. Apply this modification: ${refinement_prompt}.`;
    } else if (isRefinement && refinement_base === 'drawing') {
      finalPrompt = `${config.prompt}${subject ? ` The character is: ${subject}.` : ''} Additional instructions: ${refinement_prompt}.`;
    } else {
      finalPrompt = `${config.prompt}${subject ? ` The character is: ${subject}.` : ''}`;
    }

    console.log(`📝 Prompt: ${finalPrompt.substring(0, 150)}...`);
    console.log(`🖼️ Base: ${imageUrl.substring(0, 70)}...`);

    const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
      input: {
        prompt: finalPrompt,
        image_url: imageUrl,
        aspect_ratio: config.aspect_ratio,
        guidance_scale: isRefinement && refinement_base === 'render'
          ? 3.5
          : config.guidance_scale,
        safety_tolerance: config.safety_tolerance,
        num_images: 1,
        output_format: 'jpeg',
        seed: Math.floor(Math.random() * 9999999)
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          update.logs?.map(l => l.message).forEach(m => console.log(`  ⏳ ${m}`));
        }
      }
    });

    const generatedUrl = result?.images?.[0]?.url
      || result?.data?.images?.[0]?.url
      || result?.image?.url;

    if (!generatedUrl) {
      console.error('Risposta fal.ai:', JSON.stringify(result).substring(0, 300));
      throw new Error('Nessuna immagine generata');
    }

    console.log(`✅ Render completato`);

    const imageResponse = await fetch(generatedUrl);
    const imageBuffer = await imageResponse.arrayBuffer();

    const storagePath = `renders/${drawing_id}/${style}.jpg`;
    await supabase.storage
      .from('renders')
      .upload(storagePath, imageBuffer, { contentType: 'image/jpeg', upsert: true });

    const { data: { publicUrl } } = supabase.storage
      .from('renders')
      .getPublicUrl(storagePath);

    await supabase
      .from('renders')
      .update({
        status: 'completed',
        result_url: publicUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', render.id);

    return res.status(200).json({ success: true, render_url: publicUrl, style });

  } catch (err) {
    console.error('Errore render:', err.message || err);
    if (drawing_id && style) {
      await supabase.from('renders').update({ status: 'failed' })
        .eq('drawing_id', drawing_id).eq('style', style);
    }
    return res.status(500).json({ error: err.message || 'Errore durante la generazione.' });
  }
}
