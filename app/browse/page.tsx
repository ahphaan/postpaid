'use client';

import { useState, useEffect } from "react";
import { getAllPlans } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface FilterState {
  priceRange: [number, number];
  dataRange: [number, number];
  voiceRange: [number, number];
  smsRange: [number, number];
  providers: string[];
  sortBy: 'price' | 'data' | 'voice' | 'sms';
  sortOrder: 'asc' | 'desc';
}

export default function BrowsePlans() {
  const [plans, setPlans] = useState<PostpaidPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<PostpaidPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 2000],
    dataRange: [0, 100],
    voiceRange: [0, 3000],
    smsRange: [0, 5000],
    providers: [],
    sortBy: 'price',
    sortOrder: 'asc'
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const allPlans = await getAllPlans();
      setPlans(allPlans);
      setFilteredPlans(allPlans);
      
      // Set initial ranges based on available plans
      const prices = allPlans.map(p => p.cost || 0);
      const dataValues = allPlans.map(p => {
        if (!p.total_data) return 0;
        const value = p.total_data.toLowerCase();
        if (value.includes('unlimited')) return 1000; // Set a high value for unlimited
        return parseFloat(value) || 0;
      });
      const voiceValues = allPlans.map(p => {
        if (!p.local_calls_mins) return 0;
        const value = p.local_calls_mins.toLowerCase();
        if (value.includes('unlimited')) return 3000;
        if (value.includes('2 free numbers')) return 3000;
        return parseInt(value) || 0;
      });
      const smsValues = allPlans.map(p => {
        if (!p.local_sms) return 0;
        const value = p.local_sms.toLowerCase();
        if (value.includes('unlimited')) return 5000;
        return parseInt(value) || 0;
      });
      
      setFilters(prev => ({
        ...prev,
        priceRange: [Math.min(...prices), Math.max(...prices)],
        dataRange: [Math.min(...dataValues), Math.max(...dataValues)],
        voiceRange: [Math.min(...voiceValues), Math.max(...voiceValues)],
        smsRange: [Math.min(...smsValues), Math.max(...smsValues)],
        providers: [...new Set(allPlans.map(p => p.provider || '').filter(Boolean))]
      }));
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...plans];

    // Apply price filter
    filtered = filtered.filter(plan => 
      (plan.cost || 0) >= filters.priceRange[0] && (plan.cost || 0) <= filters.priceRange[1]
    );

    // Apply data filter
    filtered = filtered.filter(plan => {
      if (!plan.total_data) return false;
      const value = plan.total_data.toLowerCase();
      if (value.includes('unlimited')) return true;
      const dataValue = parseFloat(value) || 0;
      return dataValue >= filters.dataRange[0] && dataValue <= filters.dataRange[1];
    });

    // Apply voice filter
    filtered = filtered.filter(plan => {
      if (!plan.local_calls_mins) return false;
      const value = plan.local_calls_mins.toLowerCase();
      if (value.includes('unlimited')) return true;
      if (value.includes('2 free numbers')) return true;
      const voiceValue = parseInt(value) || 0;
      return voiceValue >= filters.voiceRange[0] && voiceValue <= filters.voiceRange[1];
    });

    // Apply SMS filter
    filtered = filtered.filter(plan => {
      if (!plan.local_sms) return false;
      const value = plan.local_sms.toLowerCase();
      if (value.includes('unlimited')) return true;
      const smsValue = parseInt(value) || 0;
      return smsValue >= filters.smsRange[0] && smsValue <= filters.smsRange[1];
    });

    // Apply provider filter
    if (filters.providers.length > 0) {
      filtered = filtered.filter(plan => plan.provider && filters.providers.includes(plan.provider));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB;
      switch (filters.sortBy) {
        case 'price':
          valueA = a.cost || 0;
          valueB = b.cost || 0;
          break;
        case 'data':
          valueA = !a.total_data ? 0 : (a.total_data.toLowerCase().includes('unlimited') ? 1000 : parseFloat(a.total_data) || 0);
          valueB = !b.total_data ? 0 : (b.total_data.toLowerCase().includes('unlimited') ? 1000 : parseFloat(b.total_data) || 0);
          break;
        case 'voice':
          valueA = !a.local_calls_mins ? 0 : (a.local_calls_mins.toLowerCase().includes('unlimited') || a.local_calls_mins.toLowerCase().includes('2 free numbers') ? 3000 : parseInt(a.local_calls_mins) || 0);
          valueB = !b.local_calls_mins ? 0 : (b.local_calls_mins.toLowerCase().includes('unlimited') || b.local_calls_mins.toLowerCase().includes('2 free numbers') ? 3000 : parseInt(b.local_calls_mins) || 0);
          break;
        case 'sms':
          valueA = !a.local_sms ? 0 : (a.local_sms.toLowerCase().includes('unlimited') ? 5000 : parseInt(a.local_sms) || 0);
          valueB = !b.local_sms ? 0 : (b.local_sms.toLowerCase().includes('unlimited') ? 5000 : parseInt(b.local_sms) || 0);
          break;
        default:
          valueA = a.cost || 0;
          valueB = b.cost || 0;
      }
      return filters.sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });

    setFilteredPlans(filtered);
  };

  // Call applyFilters whenever filters change
  useEffect(() => {
    applyFilters();
  }, [filters]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Browse Plans</h1>
          <Link href="/" className="text-primary hover:underline">
            Back to AI Search
          </Link>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Price Range */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Price Range (MVR)</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  max={filters.priceRange[1]}
                  value={filters.priceRange[0]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    priceRange: [Number(e.target.value), prev.priceRange[1]]
                  }))}
                  className="w-24"
                />
                <span className="self-center">to</span>
                <Input
                  type="number"
                  min={filters.priceRange[0]}
                  value={filters.priceRange[1]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    priceRange: [prev.priceRange[0], Number(e.target.value)]
                  }))}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          {/* Data Range */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Data Range (GB)</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  max={filters.dataRange[1]}
                  value={filters.dataRange[0]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dataRange: [Number(e.target.value), prev.dataRange[1]]
                  }))}
                  className="w-24"
                />
                <span className="self-center">to</span>
                <Input
                  type="number"
                  min={filters.dataRange[0]}
                  value={filters.dataRange[1]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dataRange: [prev.dataRange[0], Number(e.target.value)]
                  }))}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          {/* Voice Range */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Voice Minutes</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  max={3000}
                  value={filters.voiceRange[0]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    voiceRange: [Number(e.target.value), prev.voiceRange[1]]
                  }))}
                  className="w-24"
                />
                <span className="self-center">to</span>
                <Input
                  type="number"
                  min={filters.voiceRange[0]}
                  max={3000}
                  value={filters.voiceRange[1]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    voiceRange: [prev.voiceRange[0], Number(e.target.value)]
                  }))}
                  className="w-24"
                />
              </div>
              <p className="text-xs text-muted-foreground">Includes unlimited and 2 free numbers</p>
            </div>
          </div>

          {/* SMS Range */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">SMS Count</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  max={5000}
                  value={filters.smsRange[0]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    smsRange: [Number(e.target.value), prev.smsRange[1]]
                  }))}
                  className="w-24"
                />
                <span className="self-center">to</span>
                <Input
                  type="number"
                  min={filters.smsRange[0]}
                  max={5000}
                  value={filters.smsRange[1]}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    smsRange: [prev.smsRange[0], Number(e.target.value)]
                  }))}
                  className="w-24"
                />
              </div>
              <p className="text-xs text-muted-foreground">Includes unlimited</p>
            </div>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-4 mb-8">
          <Select
            value={filters.sortBy}
            onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as FilterState['sortBy'] }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="data">Data</SelectItem>
              <SelectItem value="voice">Voice Minutes</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortOrder}
            onValueChange={(value) => setFilters(prev => ({ ...prev, sortOrder: value as 'asc' | 'desc' }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Grid */}
        <div className="grid gap-4">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="p-6 rounded-lg border shadow-sm bg-card text-card-foreground"
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
      </div>
    </div>
  );
} 