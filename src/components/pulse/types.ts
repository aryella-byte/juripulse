export interface Article {
  title: string
  journal: string
  year: string
  issue: string
  page: string
  author?: string
  topics?: string[]
  methods?: string[]
  keywords?: string[]
  summary?: string
  relevance_score?: number
}

export interface TopicsData {
  summary: { total_articles: number; journal_count: number; year: string }
  journals: { journal: string; count: number }[]
  issues: { issue: string; count: number }[]
  topics: TopicItem[]
  methods: { method: string; count: number }[]
  temporal?: TemporalData
  journal_topic_matrix?: Record<string, Record<string, number>>
}

export interface TopicItem {
  topic: string
  count: number
  articles: string[]
  top_keywords?: string[]
}

export interface NetworkData {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  clusters?: Record<string, string[]>
}

export interface NetworkNode {
  id: string
  count: number
  topic?: string
  degree?: number
}

export interface NetworkEdge {
  source: string
  target: string
  weight: number
}

export interface TemporalData {
  issues: string[]
  topic_trends: Record<string, number[]>
}

export const TOPIC_COLORS = [
  '#1a365d', '#9c4221', '#285e61', '#744210', '#553c9a',
  '#9b2c2c', '#276749', '#2a4365', '#975a16', '#702459',
  '#2c5282', '#6b4226', '#22543d', '#4c1d95', '#7f1d1d',
  '#1e3a5f', '#78350f', '#064e3b', '#4a1d96', '#831843',
  '#1e40af', '#92400e',
]

export const METHOD_COLORS = ['#1a365d', '#047857', '#b45309', '#9b2c2c', '#553c9a', '#6b7280']
