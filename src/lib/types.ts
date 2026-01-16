export interface Reading {
  id: string;
  title: string;
  author: string;
  content: string; // The HTML or Markdown content
  url?: string;
  wordCount?: number;
}

export type ReadingStatus = 'unread' | 'completed';

export interface ReadingLog {
  date: string; // ISO date string YYYY-MM-DD
  readingId: string;
  status: ReadingStatus;
  reflection?: string;
}
