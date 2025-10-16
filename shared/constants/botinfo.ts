import { UUID } from "crypto"

export interface BotType {
  id: UUID
  name: string
  description: string
  detailedDescription: string
  rating: number
  isPro?: boolean
  avatar?: string
}

/**
 * Get bot avatar with fallback to default
 */
export function getBotAvatar(botId: UUID): string {
  const bot = Bots.find(b => b.id === botId);
  return bot?.avatar || "/icons/bots/_.png";
}

export const Bots: BotType[] = [
    {
        id: "550e8400-e29b-41d4-a716-446655440000" as UUID,
        name: "Random",
        description: "Makes random moves",
        detailedDescription:
        "This bot makes completely random moves. Great for beginners who want to practice without pressure.",
        rating: 400,
        avatar: "/icons/bots/random-bot.png",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440001" as UUID,
        name: "Adaptive",
        description: "Learns from your moves",
        detailedDescription:
        "This is the adaptive bot that is capable of responding to your moves at a similar skill level. Best used for training.",
        rating: 1000,
        avatar: "/icons/bots/adaptive-bot.png",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440002" as UUID,
        name: "Expert (pro)",
        description: "Advanced AI opponent",
        detailedDescription:
        "A highly advanced AI that uses sophisticated algorithms to provide a challenging experience for experienced players.",
        rating: 1800,
        avatar: "/icons/bots/expert-bot.png",
        isPro: true,
    }, 
    {
        id: "550e8400-e29b-41d4-a716-446655440004" as UUID,
        name: "Beginner",
        description: "Easy opponent for new players",
        detailedDescription:
        "Perfect for players just starting out. Makes simple moves and occasional mistakes to help you learn.",
        rating: 600,
        avatar: "/icons/bots/beginner-bot.png",
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440005" as UUID,
        name: "Intermediate",
        description: "Balanced gameplay",
        detailedDescription:
        "A well-balanced opponent that provides moderate challenge while still being approachable for most players.",
        rating: 1200,
        avatar: "/icons/bots/intermediate-bot.png",
    },
    {
        id: "f8a2c4d6-1234-4567-8901-123456789abc" as UUID,
        name: "Perfect",
        description: "Unbeatable AI",
        detailedDescription:
        "A perfect AI that makes the best possible moves every time.",
        rating: 9999,
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440006" as UUID,
        name: "Magnus Goatson",
        description: "The Ultimate Player",
        detailedDescription:
        "The ultimate Connect 4 AI. Only attempt if you're ready for the most challenging opponent available.",
        rating: 2000,
        avatar: "/icons/bots/magnus-bot.png",
        isPro: true,
    },
];