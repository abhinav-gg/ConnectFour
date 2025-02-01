import { leaderboardPlayer } from "@shared/Models/eventInfo";

interface LeaderboardTableProps {
  players: leaderboardPlayer[];
  darkMode: boolean; // lol
}

interface LeaderboardLayoutProps {
  darkMode: boolean;
  players: leaderboardPlayer[];
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

  return (
    <div className="overflow-x-auto">
      <h1 className={`text-3xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Leaderboard</h1>
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-md rounded-lg p-4`}>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Position</th>
              <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Player</th>
              <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Elo</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr 
                key={player.username}
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
                  {player.username || 'Empty'}
                </td>
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>
                  {Math.round(player.elo)}
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
      <div className="flex-1 p-8 relative">
        <LeaderboardTable players={players} darkMode={darkMode} />
        {children}
      </div>
    </div>
  );
}
