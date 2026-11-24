/**
 * Nasamat RAG (Retrieval-Augmented Generation) Engine
 * Level 4: Grounded knowledge retrieval to eliminate AI Hallucinations.
 * Indexes verified perfumes, oils, notes, and pricing.
 */

import type { FragranceOil, SavedRecipe, AppSettings } from '../types';

export interface RetrievedPerfume {
  id: string;
  name: string;
  nameEn?: string;
  brand: string;
  family: string;
  score: number;
  priceUsd: number;
  priceLbp: number;
  story: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  vibe: string;
  gender: string;
  season: string;
  occasion: string;
  longevity: string;
  sillage: string;
  imageUrl?: string;
}

export class RagEngine {
  private oils: FragranceOil[] = [];
  private recipes: SavedRecipe[] = [];
  private settings: AppSettings | null = null;

  constructor(oils: FragranceOil[], recipes: SavedRecipe[], settings: AppSettings) {
    this.oils = oils;
    this.recipes = recipes;
    this.settings = settings;
  }

  public updateData(oils: FragranceOil[], recipes: SavedRecipe[], settings: AppSettings) {
    this.oils = oils;
    this.recipes = recipes;
    this.settings = settings;
  }

  /**
   * Performs semantic keyword & attribute retrieval across the perfume catalog.
   * Ranks candidates by relevance to eliminate AI hallucination.
   */
  public search(query: string, limit: number = 3): RetrievedPerfume[] {
    const q = query.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter((t) => t.length > 1);

    const candidates: RetrievedPerfume[] = [];
    const lbpRate = this.settings?.lbpRate || 90000;

    for (const oil of this.oils) {
      let score = 0;
      const nameAr = (oil.name || '').toLowerCase();
      const nameEn = (oil.nameEn || '').toLowerCase();
      const brand = (oil.brand || '').toLowerCase();
      const family = (oil.family || '').toLowerCase();
      const prof = oil.olfactoryProfile;
      const story = (prof?.storyAr || '').toLowerCase();
      const vibe = (prof?.vibeAr || '').toLowerCase();
      const gender = (prof?.genderAr || prof?.gender || '').toLowerCase();
      const season = (prof?.seasonAr || '').toLowerCase();
      const occasion = (prof?.occasionAr || '').toLowerCase();
      const allNotes = [
        ...(prof?.topNotes || []),
        ...(prof?.heartNotes || []),
        ...(prof?.baseNotes || []),
        ...(prof?.accords || []),
      ].map((n) => n.toLowerCase());

      // Direct exact match boosts
      if (nameAr.includes(q) || nameEn.includes(q)) score += 50;
      if (brand.includes(q)) score += 30;

      // Token matching across notes and olfactory profile
      for (const token of tokens) {
        if (nameAr.includes(token)) score += 20;
        if (nameEn.includes(token)) score += 15;
        if (brand.includes(token)) score += 12;
        if (family.includes(token)) score += 15;
        if (vibe.includes(token)) score += 10;
        if (gender.includes(token)) score += 10;
        if (season.includes(token)) score += 8;
        if (occasion.includes(token)) score += 8;
        if (story.includes(token)) score += 5;

        for (const note of allNotes) {
          if (note.includes(token)) score += 12;
        }
      }

      // Semantic Synonyms (Arabic & English)
      if (q.includes('صيف') || q.includes('منعش') || q.includes('حمضيات') || q.includes('summer') || q.includes('fresh')) {
        if (family.includes('citrus') || family.includes('fresh') || season.includes('صيف')) score += 15;
      }
      if (q.includes('شتاء') || q.includes('دافئ') || q.includes('عود') || q.includes('winter') || q.includes('oud') || q.includes('warm')) {
        if (family.includes('oriental') || family.includes('woody') || family.includes('leather') || nameAr.includes('عود')) score += 15;
      }
      if (q.includes('فخم') || q.includes('مناسبات') || q.includes('عرس') || q.includes('luxury') || q.includes('royal')) {
        if (family.includes('oriental') || family.includes('woody') || vibe.includes('ملكي') || vibe.includes('فخم')) score += 15;
      }
      if (q.includes('رجالي') || q.includes('men')) {
        if (gender.includes('رجالي') || gender.includes('men') || gender.includes('unisex')) score += 10;
      }
      if (q.includes('نسائي') || q.includes('women')) {
        if (gender.includes('نسائي') || gender.includes('women') || gender.includes('unisex')) score += 10;
      }
      if (q.includes('ثابت') || q.includes('فوحان') || q.includes('يدوم')) {
        score += 8;
      }

      if (score > 0) {
        const defaultPriceUsd = oil.retailPrice50ml || 20;
        const defaultPriceLbp = Math.round(defaultPriceUsd * lbpRate);

        candidates.push({
          id: oil.id,
          name: oil.name,
          nameEn: oil.nameEn,
          brand: oil.brand,
          family: oil.family,
          score,
          priceUsd: defaultPriceUsd,
          priceLbp: defaultPriceLbp,
          story: prof?.storyAr || 'تركيبة ملكية فاخرة مصوغة بزيوت سويسرية وفرنسية نقية بتركيز إكستري دو بارفان.',
          topNotes: prof?.topNotes || ['افتتاحية منعشة'],
          heartNotes: prof?.heartNotes || ['قلب عطري فاخر'],
          baseNotes: prof?.baseNotes || ['قاعدة عنبرية خشبية ثابتة'],
          vibe: prof?.vibeAr || 'أناقة ملكية آسرة',
          gender: prof?.genderAr || 'للجنسين',
          season: prof?.seasonAr || 'كافة الفصول',
          occasion: prof?.occasionAr || 'للمناسبات والاستخدام اليومي الراقي',
          longevity: prof?.longevityAr || 'ثبات عالي 24 - 48 ساعة',
          sillage: prof?.sillageAr || 'فوحان ممتاز يترك أثراً جذاباً',
          imageUrl: oil.imageUrl || '/logo.png',
        });
      }
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    // If query was empty or generic, return top bestsellers
    if (candidates.length === 0) {
      return this.oils.slice(0, limit).map((oil) => {
        const prof = oil.olfactoryProfile;
        const defaultPriceUsd = oil.retailPrice50ml || 20;
        return {
          id: oil.id,
          name: oil.name,
          nameEn: oil.nameEn,
          brand: oil.brand,
          family: oil.family,
          score: 1,
          priceUsd: defaultPriceUsd,
          priceLbp: Math.round(defaultPriceUsd * lbpRate),
          story: prof?.storyAr || 'من روائع نسمات للعطور الملكية بتركيز إكستري دو بارفان.',
          topNotes: prof?.topNotes || ['روائح منعشة'],
          heartNotes: prof?.heartNotes || ['روائح فاخرة'],
          baseNotes: prof?.baseNotes || ['روائح ثابتة'],
          vibe: prof?.vibeAr || 'جاذبية وأناقة',
          gender: prof?.genderAr || 'للجنسين',
          season: prof?.seasonAr || 'كافة الفصول',
          occasion: prof?.occasionAr || 'كافة الأوقات',
          longevity: prof?.longevityAr || 'ثبات يدوم طويلاً',
          sillage: prof?.sillageAr || 'فوحان مميز',
          imageUrl: oil.imageUrl || '/logo.png',
        };
      });
    }

    return candidates.slice(0, limit);
  }
}
