import { hackspace, ICHackLeaderboardPlayer } from "@shared/Models/eventInfo";
import QTRIcon from "@/assets/ICH25_QTR.svg";
import SCRIcon from "@/assets/ICH25_SCR.svg";
import JCRIcon from "@/assets/ICH25_JCR.svg";
import Image from 'next/image';
import Loading from '@/components/loading';

interface LeaderboardTableProps {
  players: ICHackLeaderboardPlayer[];
  darkMode: boolean;
  isLoading?: boolean;
}

interface LeaderboardLayoutProps {
  darkMode: boolean;
  players: ICHackLeaderboardPlayer[];
  isLoading?: boolean;
  children?: React.ReactNode;
}

function LeaderboardTable({ players, darkMode }: LeaderboardTableProps) {
  const playerArray = Array.isArray(players) ? players : [];

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-700';
      default: return darkMode ? 'text-white' : 'text-black';
    }
  };

  const getHackspaceIcon = (hackspace: hackspace) => {
    switch (hackspace) {
      case "QTR": return QTRIcon;
      case "SCR": return SCRIcon;
      case "JCR": return JCRIcon;
      default: return null;
    }
  };

  return (
    <div className="overflow-x-auto">
      <h1 className={`text-3xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Leaderboard</h1>
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-md rounded-lg p-4 relative min-h-[400px]`}>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Rank</th>
                <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Player</th>
                <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Name</th>
                <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Elo</th>
              </tr>
            </thead>
            <tbody>
              {playerArray.map((player, index) => (
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
                    <div className="flex items-center justify-center gap-2">
                      {getHackspaceIcon(player.hackspace) && (
                        <Image 
                          src={getHackspaceIcon(player.hackspace).src} 
                          alt={player.hackspace} 
                          width={20} 
                          height={20} 
                        />
                      )}
                      {player.fullname}
                    </div>
                  </td>
                  <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>
                    {player.elo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
  );
}

export default function LeaderboardLayout({ darkMode, players, isLoading, children }: LeaderboardLayoutProps) {
  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="flex-1 p-8 relative">
        {isLoading ? (
          <div>
            <Loading />
          </div>
        ) : (
          <>
            <LeaderboardTable players={players} darkMode={darkMode} />
            {children}
          </>
        )}
      </div>
    </div>
  );
}