// Drizzle ORM Schema for AI News Aggregator
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const newsItems = sqliteTable('news_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url').notNull().unique(),
  source: text('source').notNull(),
  category: text('category').notNull(),
  publishedAt: integer('published_at', { mode: 'timestamp' }).notNull(),
  collectedAt: integer('collected_at', { mode: 'timestamp' }).notNull(),
  upvotes: integer('upvotes'),
  thumbnail: text('thumbnail'),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
})

export const collectionRuns = sqliteTable('collection_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runDate: integer('run_date', { mode: 'timestamp' }).notNull(),
  itemsCollected: integer('items_collected').notNull(),
  status: text('status').notNull(), // 'success', 'failed', 'partial'
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
})

export type NewsItem = typeof newsItems.$inferSelect
export type NewNewsItem = typeof newsItems.$inferInsert
export type CollectionRun = typeof collectionRuns.$inferSelect
export type NewCollectionRun = typeof collectionRuns.$inferInsert
