export enum LayoutMode {
  Vertical = 'vertical',
  Horizontal = 'horizontal',
}

export enum ThemeStyle {
  Classic = 'classic', // Ink on paper
  Dark = 'dark',       // White on charcoal
  Nature = 'nature',   // Earthy tones
}

export interface PoemAnalysis {
  mood: string;
  commentary: string; // AI generated appreciation
  suggestedTags: string[];
}

export interface Poem {
  id: string;
  title: string;
  author: string;
  content: string; // The lines of the poem
  imageUrl?: string; // Base64 or URL
  layout: LayoutMode;
  theme: ThemeStyle;
  dateCreated: number;
  analysis?: PoemAnalysis;
}

export type ViewState = 'gallery' | 'editor' | 'details' | 'admin';