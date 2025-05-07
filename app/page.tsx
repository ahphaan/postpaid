'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { rankPlansWithAI } from "@/lib/ai";
import { getAllPlans, logSearchMetric } from "@/lib/supabase";
import Head from "next/head";
import Link from "next/link";

interface PostpaidPlan {
  id: string;
  provider: string;
  package_name: string;
  cost: number;
  total_data: string;
  data_breakdown: string;
  local_calls_mins: string;
  network_calls_mins: string;
  local_sms: string;
}

const placeholders = [
  "What's the best Dhiraagu package?",
  "Show me packages with free SMS",
  "Best package under MVR 500"
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [allPlans, setAllPlans] = useState<PostpaidPlan[]>([]);
  const [displayedPlans, setDisplayedPlans] = useState<PostpaidPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const PLANS_PER_PAGE = 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    try {
      const plans = await getAllPlans();
      if (!plans || plans.length === 0) {
        alert("No plans found in the database.");
        return;
      }
      const rankedPlans = await rankPlansWithAI(question, plans);
      console.log('Ranked Plans:', rankedPlans);
      if (!rankedPlans || rankedPlans.length === 0) {
        alert("No matching packages found. Try different keywords.");
        return;
      }
      await logSearchMetric({ question, recommended_plans: rankedPlans });
      setAllPlans(rankedPlans);
      setDisplayedPlans(rankedPlans.slice(0, PLANS_PER_PAGE));
      setHasMore(rankedPlans.length > PLANS_PER_PAGE);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const currentLength = displayedPlans.length;
    const newPlans = allPlans.slice(currentLength, currentLength + PLANS_PER_PAGE);
    setDisplayedPlans([...displayedPlans, ...newPlans]);
    setHasMore(currentLength + PLANS_PER_PAGE < allPlans.length);
  };

  return (
    <>
      <Head>
        <title>Postpaid Plan Picker</title>
      </Head>
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center w-full max-w-4xl">
          <h1 className="text-2xl font-semibold text-center">Find the ideal postpaid package for you.</h1>
          <div className="flex w-full items-center space-x-2">
            <Input 
              type="text" 
              placeholder={placeholders[currentPlaceholder]}
              className="w-full h-12 text-lg rounded-md"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch}
              disabled={loading}
              className="h-12 px-6"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          <Link href="/browse" className="text-primary hover:underline">
            Browse and filter all plans
          </Link>

          {/* Results Section */}
          <div className="w-full grid gap-4 mt-8">
            {displayedPlans.map((plan, idx) => (
              <div
                key={plan.id}
                className={`p-6 rounded-lg border shadow-sm bg-card text-card-foreground ${idx === 0 ? 'border-green-600 bg-green-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">{plan.package_name}</h3>
                    <p className="text-muted-foreground">{plan.provider}</p>
                  </div>
                  <p className="text-primary font-medium">MVR{plan.cost}/month</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <span className="relative group cursor-pointer">
                      {plan.total_data}
                      {plan.data_breakdown && plan.data_breakdown.trim().toLowerCase() !== plan.total_data.trim().toLowerCase() && (
                        <>
                          <span className="text-black-700 font-bold ml-1">*</span>
                          <span className="absolute left-1/2 z-10 mt-2 w-56 -translate-x-1/2 rounded bg-white p-2 text-xs text-gray-700 shadow-lg border border-green-300 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto group-focus:pointer-events-auto">
                            {plan.data_breakdown}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Local Calls</p>
                    <p>{plan.local_calls_mins}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SMS</p>
                    <p>{plan.local_sms}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <Button
              onClick={handleLoadMore}
              variant="outline"
              className="mt-4"
            >
              Load More
            </Button>
          )}
        </main>
        {/* GitHub Link Footer */}
        <footer className="row-start-3 flex flex-col items-center justify-center mt-8">
          <a
            href="https://github.com/ahphaan/postpaid"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
            title="View on GitHub"
          >
            <svg height="24" width="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.332-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.804 5.624-5.475 5.921.43.372.823 1.102.823 2.222v3.293c0 .322.218.694.825.576C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span className="text-sm">GitHub</span>
          </a>
        </footer>
      </div>
    </>
  );
}