export type Position = 'C' | 'LW' | 'RW' | 'LD' | 'RD' | 'G';

// Added OnIceStrength type to fix "no exported member" error in SelectionOverlay.tsx
export type OnIceStrength = '5v5' | '4v4' | '3v3' | 'PP' | 'PK';

export interface GameEvent {
  id: string;
  timestamp: number;
  gameTime: string;
  team: 'home' | 'away';
  position: Position;
  // Added 'SO_GOAL' (Shootout Goal) to the type union to fix the comparison error in SelectionOverlay.tsx
  type: 'GOAL' | 'ASSIST' | 'HIT' | 'SHOT' | 'BLOCKED_SHOT' | 'TAKEAWAY' | 'PASS' | 'GIVEAWAY' | 'SAVE' | 'GOAL_AGAINST' | 'PENALTY' | 'MINOR_PENALTY' | 'MAJOR_PENALTY' | 'MISCONDUCT' | 'SO_GOAL';
  description: string;
  points: number;
  homeScoreAtEvent?: number;
  awayScoreAtEvent?: number;
  userEarned?: number;
  period: number;
}

export interface FloatingPoint {
  id: string;
  points: number;
  team: 'home' | 'away';
  position: Position;
  isUser: boolean;
  xOffset: number;
  variant: number; // For varied animation paths
}

export interface GoalExplosion {
  id: string;
  team: 'home' | 'away';
  color: string;
}

export interface LeaderboardPlayer {
  id: string;
  name: string;
  points: number;
  isUser?: boolean;
}

export interface TeamInfo {
  name: string;
  city: string;
  abbreviation: string;
  score: number;
  color: string;
  logo: string;
  logoUrl?: string;
}

export interface ScheduledGame {
  id: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  startTime: string;
  venue: string;
  status?: string;
}

export interface GameState {
  period: number;
  timeRemaining: string;
  isPaused: boolean;
  waitingForPicks: boolean;
  status?: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  userPicks: {
    home: Position | null;
    away: Position | null;
    homeNumber: number | null;
    awayNumber: number | null;
  };
  totalPoints: number;
  rank: number;
  totalPlayers: number;
  events: GameEvent[];
  puckPossession?: {
    team: 'home' | 'away';
    position: Position;
  } | null;
  // Added strength to GameState to fix "property missing" error in App.tsx
  strength: OnIceStrength;
  isPowerPlay?: boolean;
  penaltyClocks?: {
    team: 'home' | 'away';
    time: string;
    player?: string;
  }[];
}