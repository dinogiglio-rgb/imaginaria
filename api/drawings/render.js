import { fal } from "@fal-ai/client";
import { createClient } from '@supabase/supabase-js';
import { checkBetaAccess } from '../lib/betaAccess.js';

if (!process.env.FAL_KEY) {
  console.error('❌ FAL_KEY mancante nel file .env');
}

fal.config({ credentials: process.env.FAL_KEY });


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
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Metodo non consentito' });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Non autorizzato' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Token non valido' });

    const betaAccess = await checkBetaAccess(supabase, user.id);
    if (!betaAccess.allowed) return res.status(403).json({ error: betaAccess.reason });

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

    const { drawing_id, style, refinement_prompt, refinement_base } = req.body;

    if (!drawing_id || !style || !['cartoon', 'toy', 'realistic'].includes(style)) {
      return res.status(400).json({ error: 'Parametri mancanti o non validi' });
    }

    const isRefinement = !!refinement_prompt;

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
    } else {
      imageUrl = toPublicUrl(
        drawing.processed_url || drawing.original_url,
        process.env.VITE_SUPABASE_URL
      );
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'Immagine non trovata.' });
    }

    // Cerca TUTTI i record esistenti per (drawing_id, style)
    const { data: existingRecords } = await supabase
      .from('renders')
      .select('id, status')
      .eq('drawing_id', drawing_id)
      .eq('style', style);

    const completedRecord = existingRecords?.find(r => r.status === 'completed');
    const stalRecords = existingRecords?.filter(r => r.status !== 'completed') || [];

    // Elimina record bloccati (processing/failed/pending da tentativi precedenti)
    if (stalRecords.length > 0) {
      const staleIds = stalRecords.map(r => r.id);
      await supabase.from('renders').delete().in('id', staleIds);
    }

    let render;
    if (completedRecord) {
      // Esiste già un render completato: aggiorna status a processing per il nuovo tentativo
      const { data, error } = await supabase
        .from('renders')
        .update({ status: 'processing', completed_at: null })
        .eq('id', completedRecord.id)
        .select()
        .single();
      if (error) throw error;
      render = data;
    } else {
      // Nessun record esistente: inserisci nuovo
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

    const FAL_TIMEOUT_MS = 90_000 // 90 secondi

    const falPromise = fal.subscribe('fal-ai/flux-pro/kontext', {
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
      }
    })

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: fal.ai non ha risposto in 90 secondi')), FAL_TIMEOUT_MS)
    )

    const result = await Promise.race([falPromise, timeoutPromise])

    const generatedUrl = result?.images?.[0]?.url
      || result?.data?.images?.[0]?.url
      || result?.image?.url;

    if (!generatedUrl) {
      console.error('Risposta fal.ai:', JSON.stringify(result).substring(0, 300));
      throw new Error('Nessuna immagine generata');
    }

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
    console.error('ERRORE API:', err.message, err.stack);
    const { drawing_id, style } = req.body || {};
    if (drawing_id && style) {
      const supabaseFallback = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      await supabaseFallback.from('renders').update({ status: 'failed' })
        .eq('drawing_id', drawing_id).eq('style', style);
    }
    return res.status(500).json({ error: err.message || 'Errore durante la generazione.' });
  }
}
