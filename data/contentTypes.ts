// Shared types for topic content — imported by all content files

export interface TopicContent {
  slug: string;
  title: string;
  tagline: string;
  sections: Section[];
  quiz?: QuizData[];
  hasVisualizer?: string;
}

export interface Section {
  type: 'text' | 'code' | 'analogy' | 'callout' | 'comparison' | 'steps' | 'checklist';
  heading?: string;
  content?: string;
  code?: string;
  language?: string;
  label?: string;
  calloutType?: 'info' | 'warning' | 'success' | 'danger' | 'gold';
  items?: string[];
  headers?: string[];
  rows?: Record<string, string>[];
  steps?: { title: string; detail: string }[];
}

export interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
