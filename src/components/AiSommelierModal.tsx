import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, ShoppingBag, RotateCcw } from './icons';
import { AiAgent } from '../ai/aiAgent';
import type { RetrievedPerfume } from '../ai/ragEngine';
import type { FragranceOil, SavedRecipe, AppSettings, CartItem } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatWhatsAppPhone } from '../utils/whatsappConcierge';

interface AiSommelierModalProps {
  isOpen: boolean;
  onClose: () => void;
  oils: FragranceOil[];
  recipes: SavedRecipe[];
  settings: AppSettings;
  onAddToCart: (item: Omit<CartItem, 'id'>) => void;
}

export const AiSommelierModal: React.FC<AiSommelierModalProps> = ({
  isOpen,
  onClose,
  oils,
  recipes,
  settings,
  onAddToCart,
}) => {
  const { language, t } = useLanguage();
  const isAr = language === 'ar';

  const [agent] = useState(() => new AiAgent(oils, recipes, settings));
  const [messages, setMessages] = useState(() => agent.getHistory());
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep agent context updated
  useEffect(() => {
    agent.updateContext(oils, recipes, settings);
  }, [oils, recipes, settings, agent]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    setInput('');
    setIsTyping(true);

    try {
      await agent.processUserMessage(text, isAr ? 'ar' : 'en');
      setMessages([...agent.getHistory()]);
    } catch (err) {
      console.error('AI Agent error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    agent.clearHistory();
    setMessages([]);
  };

  const handleQuickAdd = (perfume: RetrievedPerfume) => {
    onAddToCart({
      itemType: 'oil',
      referenceId: perfume.id,
      name: perfume.name,
      nameEn: perfume.nameEn,
      brand: perfume.brand,
      sizeMl: 50,
      unitPrice: perfume.priceUsd,
      quantity: 1,
      oilQuantityPerBottleMl: 16.5, // 33% concentration of 50ml
      notes: `Extrait de Parfum (33%) - ${perfume.vibe}`,
      imageUrl: perfume.imageUrl || '/logo.png',
    });

    setAddedIds((prev) => ({ ...prev, [perfume.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [perfume.id]: false }));
    }, 2000);

    window.dispatchEvent(new CustomEvent('nasamat_cart_bump'));
  };

  const quickPrompts = isAr
    ? [
        'رشح لي عطراً فخماً للمناسبات الرسمية',
        'أريد عطراً صيفياً منعشاً بفوحان قوي',
        'عطر شرقي دافئ بالعود والعنبر الملكي',
        'ما هي نسبة خلط إكستري دو بارفان لزجاجة 50 مل؟',
      ]
    : [
        'Recommend an opulent luxury perfume for formal occasions',
        'I want a fresh summer fragrance with strong sillage',
        'Warm oriental scent with royal oud and amber',
        'What is the Extrait de Parfum ratio for 50ml bottle?',
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2.5 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 text-white w-full max-w-2xl h-[92vh] max-h-[820px] rounded-3xl border border-amber-500/30 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-900 via-black to-zinc-900 border-b border-amber-500/20 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-amber-400 tracking-wide">
                  {isAr ? 'مستشار وخبير نسمات الذكي' : 'Nasamat AI Perfume Sommelier'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold uppercase">
                  Level 5 AI
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {isAr ? 'ذكاء اصطناعي ملكي • تراكيب دقيقة وموثوقة بدون هلوسة' : 'Haute Parfumerie Intelligence • Grounded RAG'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                title={isAr ? 'مسح المحادثة' : 'Clear Chat'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              title={t('close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-bold text-white">
                  {isAr ? 'مرحباً بك في عالم الفخامة العطرية' : 'Welcome to Haute Parfumerie Intelligence'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isAr
                    ? 'أنا خبيرك العطري الشخصي، مدعوم بقاعدة بيانات كاملة لعطور وزيوت نسمات الملكية. اطلب ترشيحاً لذوقك، أو اسأل عن صياغة وتراكيب العطور.'
                    : 'Your bespoke AI Sommelier, grounded in verified formulations and artisan oils. Ask for scent styling, note matching, or laboratory blending.'}
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p)}
                    className="text-start p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-xs text-zinc-300 hover:text-white transition active:scale-98 cursor-pointer"
                  >
                    ✨ {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[78%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-black font-semibold rounded-br-xs'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>

              {/* Recommended Perfume Cards */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="w-full max-w-[95%] sm:max-w-[90%] grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {msg.recommendations.map((perfume) => (
                    <div
                      key={perfume.id}
                      className="p-3 rounded-2xl bg-zinc-900/90 border border-amber-500/25 hover:border-amber-500/50 flex flex-col justify-between transition-all shadow-lg"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-amber-400 truncate">
                            {isAr ? perfume.name : perfume.nameEn || perfume.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                            ${perfume.priceUsd}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {perfume.story}
                        </p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {perfume.topNotes.slice(0, 2).map((note, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300">
                              {note}
                            </span>
                          ))}
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {perfume.longevity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 mt-2 border-t border-zinc-800/80">
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(perfume)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{addedIds[perfume.id] ? (isAr ? 'تمت الإضافة ✓' : 'Added ✓') : (isAr ? 'أضف للسلة' : 'Add to Bag')}</span>
                        </button>

                        <a
                          href={`https://wa.me/${formatWhatsAppPhone(settings.storePhone)}?text=${encodeURIComponent(
                            `مرحباً نسمات، أود طلب عطر "${perfume.name}" عبر استشارة الخبير الذكي.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 transition cursor-pointer"
                          title="WhatsApp Order"
                        >
                          💬
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs p-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>{isAr ? 'خبير نسمات يحلل المكونات ويصيغ التوصية...' : 'AI Sommelier analyzing olfactory notes...'}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-zinc-900 border-t border-zinc-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAr ? 'اطلب عطركم المفضل، أو استشر الخبير العطري...' : 'Ask for scent advice, notes, or formulation...'}
              className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-amber-400 px-4 py-3 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold transition flex items-center justify-center cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
