'use server'

import { GoogleGenAI } from "@google/genai"
import type { PostpaidPlan } from "./supabase";

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_AI_API_KEY!,
})

export async function analyzeQuestion(question: string){
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Analyze this question about postpaid mobile packages and extract key terms related to:
        - Provider names (e.g., Dhiraagu, Ooredoo)
        - Data requirements (e.g., 5GB, unlimited)
        - Call minutes (e.g., 100 mins, unlimited)
        - SMS requirements
        - Budget/cost preferences
        - Any specific features (rollover, credit limit)
        
        Only respond with relevant terms separated by commas. If the question is not about postpaid packages, respond with "INVALID":
        Question: ${question}`
    });
    return response.text;
}

export async function rankPlansWithAI(question: string, plans: PostpaidPlan[]) {
    const plansText = plans.map((plan, idx) =>
        `Plan ${idx + 1}:
Provider: ${plan.provider}
Name: ${plan.package_name}
Cost: ${plan.cost}
Data: ${plan.total_data}
Calls: ${plan.local_calls_mins}
SMS: ${plan.local_sms}`
    ).join('\n\n');

    const prompt = `A user asked: "${question}"
Here are some postpaid plans:
${plansText}

Instructions for ranking plans:
1. If the user asks for "best package" or similar general queries:
   - Consider the overall value (cost vs features)
   - Prioritize plans with good data, call minutes, and SMS allocation
   - Consider the provider's network quality and reliability
2. If the user asks about free SMS:
   - Prioritize plans with higher SMS allocation
   - Consider the cost-to-SMS ratio
3. For specific requirements:
   - Match the user's stated needs (data, calls, cost, etc.)
   - Consider the overall value proposition

Rank ALL plans from most to least relevant based on these criteria. Respond ONLY with the plan numbers in order of relevance, separated by commas (e.g., 2,5,7,1,3,4,6,8).`;

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
    });
    const text = response.text?.trim() || "";
    // Extract all numbers from the response
    const indices = text.match(/\d+/g)?.map(Number) || [];
    return indices.map(i => plans[i - 1]).filter(Boolean);
}