'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Flame, ScrollText, Trophy, AlertTriangle, Shield, Users,
  RefreshCw, Loader2, Clock, DollarSign, MinusCircle,
} from 'lucide-react';
import { api } from '../../services/api-client';

interface FeedItem {
  id: string;
  type: 'contract_created' | 'contract_completed' | 'contract_failed' | 'fury_catch' | 'honeypot_test' | 'milestone' | 'bounty_paid' | 'penalty_charged';
  message: string;
  timestamp: string;
}

const EVENT_ICONS: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  contract_created: { icon: ScrollText, color: 'text-blue-400', bgColor: 'bg-blue-900/30' },
  contract_completed: { icon: Trophy, color: 'text-green-400', bgColor: 'bg-green-900/30' },
  contract_failed: { icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-900/30' },
  fury_catch: { icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-900/30' },
  honeypot_test: { icon: Shield, color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' },
  bounty_paid: { icon: DollarSign, color: 'text-emerald-400', bgColor: 'bg-emerald-900/30' },
  penalty_charged: { icon: MinusCircle, color: 'text-rose-400', bgColor: 'bg-rose-900/30' },
  milestone: { icon: Users, color: 'text-purple-400', bgColor: 'bg-purple-900/30' },
};

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getSampleFeed(): FeedItem[] {
  const now = Date.now();
  return [
    {
      id: 'sample-1',
      type: 'contract_created',
      message: 'Someone committed $250 to a 90-day fitness oath',
      timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-2',
      type: 'fury_catch',
      message: 'A Fury caught a fraudulent proof and earned $15 bounty',
      timestamp: new Date(now - 8 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-3',
      type: 'contract_completed',
      message: 'A 30-day deep work focus oath was successfully completed. $50 returned.',
      timestamp: new Date(now - 22 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-4',
      type: 'honeypot_test',
      message: 'System honeypot test: 2/3 reviewers correctly identified the fake proof',
      timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-5',
      type: 'contract_failed',
      message: 'A sobriety oath was not fulfilled. $100 captured and redistributed.',
      timestamp: new Date(now - 1.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-6',
      type: 'milestone',
      message: '500 total contracts created across the Styx network',
      timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-7',
      type: 'contract_created',
      message: 'Someone committed $75 to a 14-day digital fasting oath',
      timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-8',
      type: 'fury_catch',
      message: 'A Fury flagged a suspicious time-lapse proof for manual review',
      timestamp: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-9',
      type: 'contract_completed',
      message: 'A 60-day writing commitment was fulfilled. $200 returned to its owner.',
      timestamp: new Date(now - 7 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-10',
      type: 'contract_created',
      message: 'Someone committed $500 to a 90-day cardiovascular stamina oath',
      timestamp: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-11',
      type: 'honeypot_test',
      message: 'System honeypot test: 3/3 reviewers passed integrity check',
      timestamp: new Date(now - 18 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sample-12',
      type: 'contract_failed',
      message: 'An inbox zero commitment lapsed after 21 days. $25 captured.',
      timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export default function TavernPage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [usingSampleData, setUsingSampleData] = useState(false);

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await api.getPublicFeed(50);
      if (data.events && data.events.length > 0) {
        setFeed(data.events as FeedItem[]);
        setUsingSampleData(false);
      } else {
        setFeed(getSampleFeed());
        setUsingSampleData(true);
      }
    } catch {
      setFeed(getSampleFeed());
      setUsingSampleData(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    loadFeed();
    const interval = setInterval(() => loadFeed(), 30000);
    return () => clearInterval(interval);
  }, [loadFeed]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-neutral-400 font-bold">Loading the Tavern Board...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-700 rounded-lg flex items-center justify-center -rotate-3 shadow-[0_0_15px_rgba(180,120,40,0.3)]">
              <ScrollText className="text-amber-200" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">The Tavern Board</h1>
              <p className="text-xs text-neutral-500 uppercase tracking-widest">Public Activity Feed</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {usingSampleData && (
            <span className="px-3 py-1 bg-yellow-900/30 border border-yellow-800 rounded-full text-xs font-bold text-yellow-400">
              DEMO DATA
            </span>
          )}
          <button
            onClick={() => loadFeed(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm font-bold text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <div className="text-xs text-neutral-600 flex items-center gap-1">
            <Clock size={12} />
            {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      </header>

      {/* Decorative Notice */}
      <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl mb-8 text-center">
        <p className="text-sm text-neutral-400">
          All entries are anonymized. No personally identifiable information is displayed.
          The Tavern Board shows real-time system activity across the entire Styx network.
        </p>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {feed.map((item) => {
          const config = EVENT_ICONS[item.type] || EVENT_ICONS.milestone;
          const IconComponent = config.icon;
          return (
            <div
              key={item.id}
              className="flex items-start gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-neutral-700 transition-colors"
            >
              <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}>
                <IconComponent size={18} className={config.color} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium leading-relaxed">
                  {item.message}
                </p>
                <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                  <Clock size={10} />
                  {timeAgo(item.timestamp)}
                </p>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${config.bgColor} ${config.color}`}>
                {item.type.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      {feed.length === 0 && (
        <div className="text-center py-16">
          <ScrollText className="mx-auto text-neutral-700 mb-4" size={48} />
          <p className="text-neutral-500 font-bold">The board is empty.</p>
          <p className="text-neutral-600 text-sm mt-1">No activity yet. Be the first to create a contract.</p>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="mt-8 text-center">
        <p className="text-xs text-neutral-600 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Auto-refreshing every 30 seconds
        </p>
      </div>
    </div>
  );
}
