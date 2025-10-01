export interface BotType {
  id: string
  name: string
  description: string
  detailedDescription: string
  rating: number
  isPro?: boolean
  avatar: string
}

/**
 * Get bot avatar with fallback to default
 */
export function getBotAvatar(botId: string): string {
  const bot = Bots.find(b => b.id === botId);
  return bot?.avatar || "/icons/bots/_.png";
}

export const Bots: BotType[] = [
    {
        id: "random",
        name: "Random",
        description: "Makes random moves",
        detailedDescription:
        "This bot makes completely random moves. Great for beginners who want to practice without pressure.",
        rating: 400,
        avatar: "/icons/bots/random-bot.png",
    },
    {
        id: "adaptive",
        name: "Adaptive",
        description: "Learns from your moves",
        detailedDescription:
        "This is the adaptive bot that is capable of responding to your moves at a similar skill level. Best used for training.",
        rating: 1000,
        avatar: "/icons/bots/adaptive-bot.png",
    },
    {
        id: "expert",
        name: "Expert (pro)",
        description: "Advanced AI opponent",
        detailedDescription:
        "A highly advanced AI that uses sophisticated algorithms to provide a challenging experience for experienced players.",
        rating: 1800,
        avatar: "/icons/bots/expert-bot.png",
        isPro: true,
    },
    {
        id: "victor",
        name: "Victor",
        description: "Competitive AI",
        detailedDescription:
        "Victor is a competitive AI designed to play at tournament level. Expect no mercy from this opponent.",
        rating: 1650,
        avatar: "/icons/bots/victor-bot.png",
    },
    {
        id: "beginner",
        name: "Beginner",
        description: "Easy opponent for new players",
        detailedDescription:
        "Perfect for players just starting out. Makes simple moves and occasional mistakes to help you learn.",
        rating: 600,
        avatar: "/icons/bots/beginner-bot.png",
    },
    {
        id: "intermediate",
        name: "Intermediate",
        description: "Balanced gameplay",
        detailedDescription:
        "A well-balanced opponent that provides moderate challenge while still being approachable for most players.",
        rating: 1200,
        avatar: "/icons/bots/intermediate-bot.png",
    },
    {
        id: "e92f1571-5196-48a4-b84f-0ed1c5840e03",
        name: "Magnus Goatson",
        description: "The Ultimate Player",
        detailedDescription:
        "The ultimate Connect 4 AI. Only attempt if you're ready for the most challenging opponent available.",
        rating: 2000,
        avatar: "/icons/bots/magnus-bot.png",
        isPro: true,
    },
]