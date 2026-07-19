"use client";

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Link as LinkIcon, Building } from 'lucide-react';

export const EscrowConnect = () => {
  const [connectState, setConnectState] = useState<'IDLE' | 'LOADING' | 'CONNECTED'>('IDLE');

  const handleConnect = async () => {
    setConnectState('LOADING');
    // Simulate Plaid/Stripe handshake
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setConnectState('CONNECTED');
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Building className="text-lime-500" />
        <h3 className="font-bold text-lg">Fiat Bridge</h3>
      </div>
      
      <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
        To participate in Styx, you must securely link a financial institution. This enables the protocol to automatically place FBO holds on your capital which are seized only upon verified failure.
      </p>

      {connectState === 'IDLE' && (
        <button
          onClick={handleConnect}
          className="w-full py-3 bg-white text-black font-black rounded-xl hover:bg-neutral-200 transition-colors flex justify-center items-center gap-2"
        >
          <LinkIcon size={18} />
          CONNECT BANK ACCOUNT
        </button>
      )}

      {connectState === 'LOADING' && (
        <div className="w-full py-3 border border-neutral-700 text-neutral-300 font-bold rounded-xl flex justify-center items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          ESTABLISHING SECURE HANDSHAKE
        </div>
      )}

      {connectState === 'CONNECTED' && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="text-green-500" size={20} />
            <span className="font-bold text-green-500">Identity & Capital Verified</span>
          </div>
          <p className="text-xs text-green-400/80">Account ending in •••• 4912 is linked. Escrow holding authority granted to Styx Protocol.</p>
        </div>
      )}

      <div className="mt-6 flex gap-2 items-start text-xs text-neutral-600">
        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
        <p>Your banking credentials never touch Styx servers. Verification is routed through AES-256 encrypted Plaid endpoints.</p>
      </div>
    </div>
  );
};
