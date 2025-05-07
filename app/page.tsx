'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { analyzeQuestion, rankPlansWithAI } from "@/lib/ai";
import { getAllPlans } from "@/lib/supabase";

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

export default function Home() {
  const [question, setQuestion] = useState("");
  const [plans, setPlans] = useState<PostpaidPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    try {
      const allPlans = await getAllPlans();
      if (!allPlans || allPlans.length === 0) {
        alert("No plans found in the database.");
        return;
      }
      const topPlans = await rankPlansWithAI(question, allPlans);
      console.log('Top Plans:', topPlans);
      if (!topPlans || topPlans.length === 0) {
        alert("No matching packages found. Try different keywords.");
        return;
      }
      setPlans(topPlans);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center w-full max-w-4xl">
        <h1 className="text-2xl font-semibold text-center">Find the ideal postpaid package for you.</h1>
        <div className="flex w-full items-center space-x-2">
          <Input 
            type="text" 
            placeholder="Ask about postpaid packages..." 
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

        {/* Results Section */}
        <div className="w-full grid gap-4 mt-8">
          {plans.map((plan, idx) => (
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
              <div className="mt-4 grid grid-cols-2 gap-4">
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
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}