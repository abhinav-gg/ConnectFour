'use client'

import Dashboard from '@/components/dashboard'

export default function Leaderboard() {
  return (
    <div className="flex">
      <Dashboard />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
        <div className="bg-white shadow-md rounded-lg p-4">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Rank</th>
                <th className="px-4 py-2 text-left">Player</th>
                <th className="px-4 py-2 text-left">Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-t px-4 py-2">1</td>
                <td className="border-t px-4 py-2">Player One</td>
                <td className="border-t px-4 py-2">1500</td>
              </tr>
              <tr>
                <td className="border-t px-4 py-2">2</td>
                <td className="border-t px-4 py-2">Player Two</td>
                <td className="border-t px-4 py-2">1450</td>
              </tr>
              <tr>
                <td className="border-t px-4 py-2">3</td>
                <td className="border-t px-4 py-2">Player Three</td>
                <td className="border-t px-4 py-2">1400</td>
              </tr>
              <tr>
                <td className="border-t px-4 py-2">4</td>
                <td className="border-t px-4 py-2">Player Four</td>
                <td className="border-t px-4 py-2">1350</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}