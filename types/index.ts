export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Topic {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  estimatedTime: number;
  prerequisites: string[];
  category: string;
  icon: string; // Lucide icon name e.g. 'Server', 'Globe'
  completed?: boolean;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  topics: Topic[];
  color: string;
}

export interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CodeExample {
  language: string;
  code: string;
  label: string;
  explanation?: string;
}

export interface SearchResult {
  topicId: string;
  topicTitle: string;
  categoryTitle: string;
  snippet: string;
  slug: string;
}
