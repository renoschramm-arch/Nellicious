export type KnowledgeCategory = 'grundlagen' | 'praxis' | 'fasten' | 'sicherheit' | 'fortgeschritten'

export type KnowledgeArticle = {
  id: string
  category: KnowledgeCategory
}

export const KNOWLEDGE_CATEGORY_ORDER: KnowledgeCategory[] = [
  'grundlagen', 'praxis', 'fasten', 'sicherheit', 'fortgeschritten',
]

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  { id: 'kalorien-makros', category: 'grundlagen' },
  { id: 'defizit-ueberschuss', category: 'grundlagen' },
  { id: 'ernaehrungsformen', category: 'grundlagen' },
  { id: 'unvertraeglichkeits-tags', category: 'grundlagen' },
  { id: 'gewicht-schwankt', category: 'grundlagen' },
  { id: 'portionsgroessen', category: 'praxis' },
  { id: 'zutaten-skalieren', category: 'praxis' },
  { id: 'naehrwerte-lesen', category: 'praxis' },
  { id: 'heisshunger', category: 'praxis' },
  { id: 'meal-prep', category: 'praxis' },
  { id: 'autophagie', category: 'fasten' },
  { id: 'protokoll-vergleich', category: 'fasten' },
  { id: 'hungergefuehl', category: 'fasten' },
  { id: 'fastenbrechen', category: 'fasten' },
  { id: 'fasten-sport', category: 'fasten' },
  { id: 'wann-abbrechen', category: 'sicherheit' },
  { id: 'frauen-fasten', category: 'sicherheit' },
  { id: 'fasten-medikamente', category: 'sicherheit' },
  { id: 'mangelernaehrung', category: 'sicherheit' },
  { id: 'plateau', category: 'fortgeschritten' },
  { id: 'makros-training', category: 'fortgeschritten' },
  { id: 'mentale-vorteile', category: 'fortgeschritten' },
]
