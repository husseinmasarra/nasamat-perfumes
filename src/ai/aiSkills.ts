/**
 * AI Skills & Tool Calling Engine (MCP Architecture)
 * Level 4: Executable skills invoked by the AI agent
 */

import type { RagEngine, RetrievedPerfume } from './ragEngine';
import type { AppSettings } from '../types';

export interface FormulationResult {
  bottleSizeMl: number;
  oilMl: number;
  alcoholMl: number;
  fixativeDrops: number;
  concentrationPercent: number;
  summaryAr: string;
}

export class AiSkills {
  private rag: RagEngine;
  private settings: AppSettings;

  constructor(rag: RagEngine, settings: AppSettings) {
    this.rag = rag;
    this.settings = settings;
  }

  /**
   * Skill 1: Search Catalog (RAG tool)
   */
  public searchFragranceCatalog(query: string, limit: number = 3): RetrievedPerfume[] {
    return this.rag.search(query, limit);
  }

  /**
   * Skill 2: Calculate Formulation
   * Computes luxury Extrait de Parfum ratios for any bottle size
   */
  public calculateFormulation(sizeMl: number = 50, oilRatioPercent: number = 33): FormulationResult {
    const validSize = sizeMl <= 0 ? 50 : sizeMl;
    const ratio = Math.min(50, Math.max(20, oilRatioPercent)); // 20% to 50% Extrait de Parfum
    const oilMl = Number(((validSize * ratio) / 100).toFixed(1));
    const fixativePercent = this.settings.defaultFixativePercent || 1.5;
    const fixativeDrops = Math.round((validSize * fixativePercent) / 10);
    const alcoholMl = Number((validSize - oilMl).toFixed(1));

    return {
      bottleSizeMl: validSize,
      oilMl,
      alcoholMl,
      fixativeDrops,
      concentrationPercent: ratio,
      summaryAr: `صياغة إكستري دو بارفان (${ratio}% تركيز): ${oilMl} مل زيت فرنسي/سويسري نقي + ${alcoholMl} مل كحول عطري نقي + ${fixativeDrops} قطرات مثبت ملكي.`,
    };
  }

  /**
   * Skill 3: Currency & Lebanese Pound Real-time Conversion
   */
  public convertCurrency(amountUsd: number): { usd: number; lbp: number; formattedLbp: string } {
    const rate = this.settings.lbpRate || 90000;
    const lbp = Math.round(amountUsd * rate);
    return {
      usd: amountUsd,
      lbp,
      formattedLbp: `${lbp.toLocaleString()} ل.ل`,
    };
  }

  /**
   * Skill 4: Format Direct WhatsApp VIP Order Link
   */
  public createWhatsAppOrderLink(perfumeName: string, sizeMl: number = 50, priceUsd: number = 20): string {
    const phone = this.settings.storePhone?.replace(/[^0-9]/g, '') || '96181713408';
    const cleanPhone = phone.startsWith('00') ? phone.slice(2) : phone.startsWith('0') ? `961${phone.slice(1)}` : phone;
    const message = `مرحباً نسمات للعطور، أود طلب عطر "${perfumeName}" بحجم ${sizeMl} مل بسعر $${priceUsd} عبر استشارة الخبير الذكي. يرجى تأكيد الطلب والتوصيل.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
}
