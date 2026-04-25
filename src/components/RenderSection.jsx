import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const STILI = [
  {
    id: 'cartoon',
    label: '🎬 Cartoon',
    desc: 'Stile cartone animato',
    color: 'from-[#FF7F6A] to-[#ff9a8b]'
  },
  {
    id: 'toy',
    label: '🧸 Toy',
    desc: 'Giocattolo morbido',
    color: 'from-[#A084E8] to-[#b89ff0]'
  },
  {
    id: 'realistic',
    label: '📸 Realistic',
    desc: 'Foto realistica',
    color: 'from-[#4ecdc4] to-[#B2EBF2]'
  }
];

export default function RenderSection({ drawingId, hasAiPrompt }) {
  const [renders, setRenders] = useState({});
  const [loading, setLoading] = useState({});
  const [activeRender, setActiveRender] = useState(null);
  const [editingStyle, setEditingStyle] = useState(null);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [refinementBase, setRefinementBase] = useState('render');

  useEffect(() => {
    if (!drawingId) return;
    loadExistingRenders();
  }, [drawingId]);

  async function loadExistingRenders() {
    const { data } = await supabase
      .from('renders')
      .select('style, status, result_url')
      .eq('drawing_id', drawingId);

    if (data) {
      const map = {};
      data.forEach(r => { if (r.result_url) map[r.style] = r.result_url; });
      setRenders(map);
      const firstStyle = Object.keys(map)[0];
      if (firstStyle) setActiveRender(firstStyle);
    }
  }

  async function generaRender(style, isRefinement = false) {
    if (!hasAiPrompt) {
      alert('Analizza prima il disegno con l\'AI! 🤖');
      return;
    }

    setLoading(prev => ({ ...prev, [style]: true }));
    if (isRefinement) setEditingStyle(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const body = { drawing_id: drawingId, style };
      if (isRefinement && refinementPrompt.trim()) {
        body.refinement_prompt = refinementPrompt.trim();
        body.refinement_base = refinementBase;
      }

      const res = await fetch('/api/drawings/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.success) {
        const urlNoCache = `${data.render_url}?t=${Date.now()}`;
        setRenders(prev => ({ ...prev, [style]: urlNoCache }));
        setActiveRender(style);
        setRefinementPrompt('');
      } else {
        alert(data.error || 'Errore nella generazione. Riprova!');
      }
    } catch (err) {
      alert('Connessione interrotta. Riprova!');
    } finally {
      setLoading(prev => ({ ...prev, [style]: false }));
    }
  }

  const rendersCompletati = STILI.filter(s => renders[s.id]);

  return (
    <div className="mt-6">
      <h2 className="font-['Outfit'] font-bold text-xl text-gray-800 mb-1">
        ✨ Trasformazioni Magiche
      </h2>
      <p className="text-sm text-gray-500 mb-4 font-['Inter']">
        Scegli uno stile per trasformare il disegno con l'AI
      </p>

      {/* Bottoni stile */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {STILI.map(stile => (
          <button
            key={stile.id}
            onClick={() => generaRender(stile.id)}
            disabled={loading[stile.id]}
            className={`
              relative flex flex-col items-center justify-center p-3 rounded-[16px]
              bg-gradient-to-br ${stile.color} text-white
              shadow-md active:scale-95 transition-transform
              disabled:opacity-60 disabled:cursor-not-allowed
              ${renders[stile.id] ? 'ring-2 ring-offset-2 ring-[#A084E8]' : ''}
            `}
          >
            {loading[stile.id] ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-['Inter']">Magia...</span>
              </div>
            ) : (
              <>
                <span className="text-2xl mb-1">{stile.label.split(' ')[0]}</span>
                <span className="text-xs font-bold font-['Outfit']">
                  {stile.label.split(' ')[1]}
                </span>
                <span className="text-[10px] opacity-80 font-['Inter'] text-center">
                  {stile.desc}
                </span>
                {renders[stile.id] && (
                  <span className="absolute top-1 right-1 text-xs">✅</span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Render attivo grande */}
      {activeRender && renders[activeRender] && (
        <div className="rounded-[20px] overflow-hidden border-2 border-[#A084E8] shadow-lg mb-4">
          <div className="bg-[#A084E8] text-white text-xs font-['Outfit'] font-bold px-4 py-2 flex items-center justify-between">
            <span>
              ✨ RENDER MAGICO —{' '}
              {STILI.find(s => s.id === activeRender)?.label}
            </span>
            <button
              onClick={() => {
                setEditingStyle(editingStyle === activeRender ? null : activeRender);
                setRefinementPrompt('');
                setRefinementBase('render');
              }}
              className="bg-white/20 hover:bg-white/30 text-white text-xs
                         px-3 py-1 rounded-full transition-colors font-['Inter']"
            >
              ✏️ Modifica
            </button>
          </div>
          <img
            src={renders[activeRender]}
            alt="Render magico"
            className="w-full object-cover"
          />

          {/* Pannello modifica */}
          {editingStyle === activeRender && (
            <div className="bg-[#FAF9F6] border-t border-[#A084E8]/30 p-4">
              <p className="text-sm font-['Outfit'] font-bold text-gray-700 mb-3">
                ✏️ Modifica questo render
              </p>

              {/* Scelta base */}
              <div className="flex gap-3 mb-2">
                <button
                  onClick={() => setRefinementBase('render')}
                  className={`flex-1 py-2 px-3 rounded-[12px] text-xs font-['Inter'] font-medium border-2 transition-colors
                    ${refinementBase === 'render'
                      ? 'border-[#A084E8] bg-[#A084E8] text-white'
                      : 'border-gray-200 bg-white text-gray-600'
                    }`}
                >
                  ✏️ Modifica render
                </button>
                <button
                  onClick={() => setRefinementBase('drawing')}
                  className={`flex-1 py-2 px-3 rounded-[12px] text-xs font-['Inter'] font-medium border-2 transition-colors
                    ${refinementBase === 'drawing'
                      ? 'border-[#FF7F6A] bg-[#FF7F6A] text-white'
                      : 'border-gray-200 bg-white text-gray-600'
                    }`}
                >
                  🎨 Rigenera dal disegno
                </button>
              </div>

              <p className="text-[10px] text-gray-400 font-['Inter'] mb-3">
                {refinementBase === 'render'
                  ? 'Applica modifiche al render già generato'
                  : 'Ricomincia dal disegno originale con nuove indicazioni'
                }
              </p>

              <textarea
                value={refinementPrompt}
                onChange={e => setRefinementPrompt(e.target.value)}
                placeholder={refinementBase === 'render'
                  ? 'Es: aggiungi un cappello rosso, cambia lo sfondo...'
                  : 'Es: sfondo spaziale, colori più vivaci...'
                }
                rows={3}
                className="w-full border border-gray-200 rounded-[12px] p-3 text-sm
                           font-['Inter'] text-gray-700 resize-none focus:outline-none
                           focus:border-[#A084E8] bg-white"
              />

              <button
                onClick={() => generaRender(activeRender, true)}
                disabled={!refinementPrompt.trim() || loading[activeRender]}
                className="w-full mt-3 py-3 rounded-[14px] text-sm font-['Outfit'] font-bold
                           text-white transition-opacity
                           disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: refinementBase === 'render'
                    ? 'linear-gradient(135deg, #A084E8, #b89ff0)'
                    : 'linear-gradient(135deg, #FF7F6A, #ff9a8b)'
                }}
              >
                {loading[activeRender] ? '⏳ Generando...' : '✨ Applica Modifica'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Galleria miniature se più di un render */}
      {rendersCompletati.length > 1 && (
        <div>
          <p className="text-xs text-gray-400 font-['Inter'] mb-2">
            Tutti i render generati:
          </p>
          <div className="grid grid-cols-3 gap-2">
            {rendersCompletati.map(stile => (
              <div
                key={stile.id}
                onClick={() => setActiveRender(stile.id)}
                className={`rounded-[12px] overflow-hidden cursor-pointer border-2 transition-colors
                  ${activeRender === stile.id ? 'border-[#FF7F6A]' : 'border-transparent'}`}
              >
                <img
                  src={renders[stile.id]}
                  alt={stile.label}
                  className="w-full aspect-square object-cover block"
                />
                <p className="text-center font-['Inter'] text-[10px] text-gray-400 py-1">
                  {stile.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
