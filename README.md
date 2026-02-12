# AI News Daily

A daily AI news aggregator that collects 100+ AI-related items from multiple sources, categorizes them, and presents them in a clean, modern interface.

## Features

- 📰 **Multiple Sources**: Aggregates from Hacker News, Reddit, arXiv, GitHub Trending
- 🏷️ **Smart Categorization**: Organizes content into categories (Company News, Tips & Tutorials, Research, etc.)
- 🔍 **Filter & Search**: Filter by category, source, or search by keywords
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🌙 **Dark Mode**: Automatic dark mode based on system preference
- ⚡ **Fast Performance**: Built with Next.js 15 and React 19

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS, Lucide React icons
- **State**: React Hooks (useState, useCallback)
- **Backend**: Next.js API Routes
- **Database**: SQLite with Drizzle ORM
- **Deployment**: Vercel (production), Local (development)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) or [Node.js](https://nodejs.org/) 18+
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd auto-push-ai-news
```

2. Install dependencies:
```bash
bun install
```

3. Initialize the database:
```bash
bun run db:push
```

4. Run the development server:
```bash
bun run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Collecting News

Click the **Collect** button on the home page to trigger news collection from all sources. This will:
- Fetch latest AI-related posts from Hacker News
- Get top posts from AI subreddits (r/MachineLearning, r/artificial, r/ChatGPT, r/OpenAI)
- Retrieve recent AI/ML papers from arXiv
- Find trending AI repositories on GitHub

### Filtering

- Click any category tab to filter by that category
- Each tab shows the number of items available
- Use the browser's find function (Ctrl+F / Cmd+F) to search within loaded items

### Loading More

Scroll to the bottom and click **Load More** to load additional items.

## Project Structure

```
auto-push-ai-news/
├── app/                          # Next.js app router
│   ├── api/
│   │   ├── news/                 # News API route
│   │   └── collect/              # Collection trigger endpoint
│   ├── (main)/
│   │   ├── page.tsx             # Home page
│   │   └── layout.tsx           # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # Reusable UI components
│   ├── news/                    # News-specific components
│   └── layout/                  # Layout components (Header, Footer)
├── lib/
│   ├── db.ts                    # Database connection
│   ├── schema.ts                # Drizzle schema
│   └── utils.ts                # Utility functions
├── services/
│   └── collectors/              # Content collectors
│       ├── hacker-news.ts       # HN API integration
│       ├── reddit.ts           # Reddit JSON API
│       ├── arxiv.ts           # arXiv API
│       └── github.ts          # GitHub Trending
└── types/
    └── news.ts                # TypeScript types
```

## Database Schema

### news_items
- `id`: Primary key
- `title`: News item title
- `description`: Item description/summary
- `url`: Unique URL identifier
- `source`: Source (hacker-news, reddit, arxiv, github)
- `category`: Category classification
- `publishedAt`: Original publication date
- `collectedAt`: Collection timestamp
- `upvotes`: Vote count (if available)
- `thumbnail`: Image URL (optional)
- `tags`: JSON array of tags

### collection_runs
- `id`: Primary key
- `runDate`: Date of collection run
- `itemsCollected`: Number of items collected
- `status`: success, failed, or partial
- `startedAt`: Start timestamp
- `completedAt`: Completion timestamp (null if failed)

## API Endpoints

### GET /api/news

Query parameters:
- `category`: Filter by category (optional)
- `source`: Filter by source (optional)
- `date`: Filter by date (optional)
- `limit`: Number of items (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)

### POST /api/collect/trigger

Triggers a manual collection run from all sources.

Query parameters:
- `source`: Collect from a specific source only (optional)

## Development

### Database Commands

```bash
# Push schema to database
bun run db:push

# Open Drizzle Studio
bun run db:studio

# Generate migration
bun run db:generate
```

### Adding New Collectors

1. Create a new file in `services/collectors/`
2. Follow the pattern of existing collectors
3. Return a `CollectorResult` object
4. Import and call it in `app/api/collect/trigger/route.ts`

### Adding New Sources

Update the `NewsSource` and `NewsCategory` types in `types/news.ts`, then create a collector for that source.

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set environment variables (if using Postgres)
4. Deploy

### Cron Jobs

For Vercel, create `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/collect/trigger",
    "schedule": "0 8 * * *"
  }]
}
```

This triggers collection daily at 8 AM UTC.

## Future Enhancements

- [ ] Add more sources (Product Hunt, Twitter, LinkedIn, etc.)
- [ ] Implement full-text search
- [ ] Add user authentication and preferences
- [ ] Support for push notifications
- [ ] Email digests
- [ ] Social sharing features
- [ ] Comments and discussions

## License

MIT

## Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Lucide Icons](https://lucide.dev/)
