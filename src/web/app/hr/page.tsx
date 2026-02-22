import React from 'react';

export default function HRDashboard() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-12 font-sans">
      <header className="mb-12 border-b border-gray-800 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-gray-300">Styx Corporate</h1>
          <p className="text-sm text-gray-600 mt-1 uppercase tracking-widest">Enterprise Group Analytics</p>
        </div>
        <div className="text-right text-sm">
          <div className="text-green-500 font-bold mb-1">Company: ACME INC.</div>
          <div className="text-gray-500">Total Enrolled: 420 Employees</div>
          <div className="text-gray-500">Group Integrity Score: 8,450 (Top 12%)</div>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-black border border-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-500 text-xs uppercase mb-2">Total Pounds Lost</h3>
          <p className="text-4xl font-bold text-green-500">1,240 lb</p>
        </div>
        <div className="bg-black border border-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-500 text-xs uppercase mb-2">Completion Rate</h3>
          <p className="text-4xl font-bold text-blue-500">84%</p>
        </div>
        <div className="bg-black border border-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-500 text-xs uppercase mb-2">Failed Contracts</h3>
          <p className="text-4xl font-bold text-red-500">67</p>
        </div>
        <div className="bg-black border border-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-500 text-xs uppercase mb-2">Peer Audits Conducted</h3>
          <p className="text-4xl font-bold text-yellow-500">3,401</p>
        </div>
      </main>
      <div className="mt-12 text-xs text-gray-700 uppercase tracking-widest text-center">
        Note: PII and specific employee performance metrics are structurally redacted by the Aegis protocol.
      </div>
    </div>
  );
}
