
import { Position } from './types';

export const SCORING_RULES = {
  SKATER: {
    GOAL: 5000,
    ASSIST: 1000,
    HIT: 500,
    SHOT: 200,
    BLOCKED_SHOT: 200,
    TAKEAWAY: 200,
    PASS: 100,
    GIVEAWAY: -200,
    PENALTY: -500,
    MINOR_PENALTY: -500,
    MAJOR_PENALTY: -1500,
    MISCONDUCT: -2000,
  },
  GOALIE: {
    SAVE: 250,
    GOAL_AGAINST: -1000,
  }
};

export const POSITIONS: { value: Position; label: string }[] = [
  { value: 'C', label: 'Center' },
  { value: 'LW', label: 'Left Wing' },
  { value: 'RW', label: 'Right Wing' },
  { value: 'LD', label: 'Left Defense' },
  { value: 'RD', label: 'Right Defense' },
  { value: 'G', label: 'Goalie' },
];

export const INITIAL_TEAMS = {
  home: {
    name: 'Rangers',
    city: 'New York',
    abbreviation: 'NYR',
    score: 0,
    color: '#0038A8',
    logo: '🗽'
  },
  away: {
    name: 'Bruins',
    city: 'Boston',
    abbreviation: 'BOS',
    score: 0,
    color: '#FFB81C',
    logo: '🐻'
  }
};

export const PLAYER_DATA: Record<string, Record<Position, { name: string; jerseyNumber: number }[]>> = {
  'Rangers': { 
    'C': [{ name: 'M. Zibanejad', jerseyNumber: 93 }, { name: 'V. Trocheck', jerseyNumber: 16 }, { name: 'F. Chytil', jerseyNumber: 72 }, { name: 'J. Brodzinski', jerseyNumber: 22 }], 
    'LW': [{ name: 'A. Panarin', jerseyNumber: 10 }, { name: 'C. Kreider', jerseyNumber: 20 }, { name: 'W. Cuylle', jerseyNumber: 50 }, { name: 'M. Rempe', jerseyNumber: 73 }], 
    'RW': [{ name: 'A. Lafreniere', jerseyNumber: 13 }, { name: 'K. Kakko', jerseyNumber: 24 }, { name: 'J. Vesey', jerseyNumber: 26 }, { name: 'R. Smith', jerseyNumber: 19 }], 
    'LD': [{ name: 'R. Lindgren', jerseyNumber: 55 }, { name: 'K. Miller', jerseyNumber: 79 }, { name: 'Z. Jones', jerseyNumber: 6 }, { name: 'E. Gustafsson', jerseyNumber: 56 }], 
    'RD': [{ name: 'A. Fox', jerseyNumber: 23 }, { name: 'J. Trouba', jerseyNumber: 8 }, { name: 'B. Schneider', jerseyNumber: 4 }, { name: 'C. Ruhwedel', jerseyNumber: 5 }], 
    'G': [{ name: 'I. Shesterkin', jerseyNumber: 31 }, { name: 'J. Quick', jerseyNumber: 32 }] 
  },
  'Bruins': { 
    'C': [{ name: 'C. Coyle', jerseyNumber: 13 }, { name: 'P. Zacha', jerseyNumber: 18 }, { name: 'M. Geekie', jerseyNumber: 39 }, { name: 'J. Beecher', jerseyNumber: 19 }], 
    'LW': [{ name: 'B. Marchand', jerseyNumber: 63 }, { name: 'J. van Riemsdyk', jerseyNumber: 21 }, { name: 'D. Heinen', jerseyNumber: 43 }, { name: 'J. Lauko', jerseyNumber: 94 }], 
    'RW': [{ name: 'D. Pastrnak', jerseyNumber: 88 }, { name: 'J. DeBrusk', jerseyNumber: 74 }, { name: 'T. Frederic', jerseyNumber: 11 }, { name: 'J. Brazeau', jerseyNumber: 55 }], 
    'LD': [{ name: 'H. Lindholm', jerseyNumber: 27 }, { name: 'M. Lohrei', jerseyNumber: 6 }, { name: 'D. Forbort', jerseyNumber: 28 }, { name: 'P. Wotherspoon', jerseyNumber: 29 }], 
    'RD': [{ name: 'C. McAvoy', jerseyNumber: 73 }, { name: 'B. Carlo', jerseyNumber: 25 }, { name: 'K. Shattenkirk', jerseyNumber: 22 }, { name: 'A. Peeke', jerseyNumber: 52 }], 
    'G': [{ name: 'J. Swayman', jerseyNumber: 1 }, { name: 'L. Ullmark', jerseyNumber: 35 }] 
  }
};
