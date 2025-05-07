import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function searchPackages(keywords: string[]) {
  let query = supabase.from('postpaid_plans').select('*')
  
  // Check for provider-specific searches
  const providers = ['maxis', 'digi', 'celcom', 'umobile']
  const providerKeywords = keywords.filter(k => providers.includes(k.toLowerCase()))
  
  // Check for price-related terms and numbers
  const priceTerms = ['less than', 'under', 'below', 'cheaper than', 'maximum', 'max']
  const priceKeywords = keywords.filter(k => 
    priceTerms.some(term => k.toLowerCase().includes(term)) || 
    k.match(/^\d+$/)
  )
  
  if (providerKeywords.length > 0) {
    query = query.in('provider', providerKeywords)
  }
  
  if (priceKeywords.length > 0) {
    const maxCost = Math.max(...priceKeywords.map(k => parseInt(k) || 0))
    if (maxCost > 0) {
      query = query.lte('cost', maxCost)
    }
  }
  
  // For other keywords, search in package details
  const otherKeywords = keywords.filter(k => 
    !providers.includes(k.toLowerCase()) && 
    !priceTerms.some(term => k.toLowerCase().includes(term)) &&
    !k.match(/^\d+$/)
  )
  
  if (otherKeywords.length > 0) {
    query = query.or(
      otherKeywords.map(keyword => 
        `package_name.ilike.%${keyword}%,total_data.ilike.%${keyword}%,local_calls_mins.ilike.%${keyword}%`
      ).join(',')
    )
  }

  const { data, error } = await query.limit(3)

  if (error) throw error
  return data
}

export async function getAllPlans() {
  const { data, error } = await supabase.from('postpaid_plans').select('*');
  if (error) throw error;
  return data;
}

export async function logSearchMetric({ question, recommended_plans }: { question: string, recommended_plans: any[] }) {
  const package_names = recommended_plans.map(plan => plan.package_name);
  const { error } = await supabase.from('search_metrics').insert([
    {
      question,
      recommended_package_names: package_names
    }
  ]);
  if (error) console.error('Metric logging error:', error);
}