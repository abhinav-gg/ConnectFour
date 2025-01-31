import { hackspace, ICHackLeaderboardPlayer } from "@shared/Models/eventInfo";
import Dashboard from '@/components/dashboard';

interface LeaderboardTableProps {
  players: ICHackLeaderboardPlayer[];
  darkMode: boolean; // lol
}

interface LeaderboardLayoutProps {
  darkMode: boolean;
  players: ICHackLeaderboardPlayer[];
  children?: React.ReactNode;
}

function LeaderboardTable({ players, darkMode }: LeaderboardTableProps) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-700';
      default: return darkMode ? 'text-white' : 'text-black';
    }
  };

  const getHackspaceColor = (hackspace: hackspace) => {
    switch (hackspace) {
      case "QTR": return 'bg-red-500';
      case "SCR": return 'bg-blue-500';
      case "JCR": return 'bg-yellow-500';
      default: return 'bg-gray-500'; // fallback color
    }
  };

  return (
    <div className="overflow-x-auto">
      <h1 className={`text-3xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Leaderboard</h1>
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-md rounded-lg p-4`}>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Rank</th>
              <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Player</th>
              <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Score</th>
              <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Fullname</th>
              <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Hackspace</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr 
                key={player.rank}
                className={`
                  border-b dark:border-gray-700
                  opacity-0
                  animate-fadeInUp
                `}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center font-bold ${getRankStyle(player.rank)}`}>
                  {player.rank}
                </td>
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getHackspaceColor(player.hackspace)}`}></span>
                  {player.username || 'Empty'}
                </td>
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>
                  {player.elo}
                </td>
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>
                  {player.fullname}
                </td>
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getHackspaceColor(player.hackspace)}`}></span>
                  {player.hackspace}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function LeaderboardLayout({ darkMode, players, children }: LeaderboardLayoutProps) {
  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-black' : 'bg-white'}`}>
      <Dashboard />
      <div className="flex-1 p-8 relative">
        <LeaderboardTable players={players} darkMode={darkMode} />
        {children}
      </div>
    </div>
  );
}