# Postpaid Plan Picker

A Next.js app to help users find the ideal postpaid mobile package using natural language queries, Google Gemini AI, and Supabase.

## Features
- Ask questions about postpaid plans in natural language
- AI-powered semantic search and ranking (Gemini)
- Fetches and displays top 3 relevant plans from Supabase
- Clean, responsive UI with Tailwind CSS
- Tooltip for data breakdowns, provider and cost highlighting
- GitHub link in footer
- **Metrics tracking:** Logs each search (question and recommended package names) in Supabase for analytics

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/ahphaan/postpaid.git
cd postpaid
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Set up environment variables
Create a `.env.local` file in the root directory with the following:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_AI_API_KEY=your_gemini_api_key
```

### 4. Run the development server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage
- Type a question about postpaid plans (e.g., "Ooredoo plan under 500 with at least 10GB data")
- The app will show the top 3 most relevant plans
- Hover over the * next to data to see breakdowns (if available)

## Database Schema
The app expects a `postpaid_plans` table in Supabase with columns:
- `id` (UUID, primary key)
- `provider` (text)
- `package_name` (text)
- `cost` (integer)
- `total_data` (text)
- `data_breakdown` (text)
- `data_rollover` (boolean)
- `local_calls_mins` (text)
- `network_calls_mins` (text)
- `local_sms` (text)
- `excess_sms_charge` (numeric)
- `excess_call_charge` (numeric)
- `credit_limit` (integer)
- `excess_data_charge` (text)

### Metrics Table
The app also logs each search in a `search_metrics` table:
- `id` (UUID, primary key)
- `created_at` (timestamp)
- `question` (text)
- `recommended_package_names` (text[]) – array of package names in ranked order

## Links
- [Live Demo](https://postpaid-sage.vercel.app/)
- [GitHub Repository](https://github.com/ahphaan/postpaid)
