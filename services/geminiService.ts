import { GoogleGenAI, Type } from "@google/genai";
import { GameEvent, Position, ScheduledGame } from "../types";
import { SCORING_RULES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const fetchTodayGames = async (): Promise<ScheduledGame[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Find today's NHL schedule (current date is " + new Date().toLocaleDateString() + "). Return a list of games including home team, away team, start time, and venue. Include city names, full team names, and short abbreviations like NYR or BOS. IMPORTANT: For each team, find and include the URL to their official NHL logo (PNG or SVG format). Also include a representative emoji for team logos as a fallback. Also include the current status of the game (e.g., 'Scheduled', 'Live', 'Intermission', 'Final').",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            games: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  status: { type: Type.STRING, description: "Current status of the game (e.g., 'Scheduled', 'Live', 'Intermission', 'Final')" },
                  homeTeam: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      city: { type: Type.STRING },
                      abbreviation: { type: Type.STRING },
                      color: { type: Type.STRING, description: "hex color code" },
                      logo: { type: Type.STRING, description: "emoji logo" },
                      logoUrl: { type: Type.STRING, description: "official logo URL" },
                      score: { type: Type.INTEGER, description: "current score if live or final" }
                    },
                    required: ['name', 'city', 'abbreviation', 'color', 'logo', 'logoUrl']
                  },
                  awayTeam: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      city: { type: Type.STRING },
                      abbreviation: { type: Type.STRING },
                      color: { type: Type.STRING, description: "hex color code" },
                      logo: { type: Type.STRING, description: "emoji logo" },
                      logoUrl: { type: Type.STRING, description: "official logo URL" },
                      score: { type: Type.INTEGER, description: "current score if live or final" }
                    },
                    required: ['name', 'city', 'abbreviation', 'color', 'logo', 'logoUrl']
                  },
                  startTime: { type: Type.STRING },
                  venue: { type: Type.STRING }
                },
                required: ['id', 'homeTeam', 'awayTeam', 'startTime', 'venue']
              }
            }
          },
          required: ['games']
        }
      }
    });

    const data = JSON.parse(response.text || '{"games": []}');
    return data.games;
  } catch (error) {
    console.error("Error fetching today's games:", error);
    return [
      {
        id: "mock-1",
        homeTeam: { 
          name: "Rangers", 
          city: "New York", 
          abbreviation: "NYR", 
          color: "#0038A8", 
          logo: "🗽",
          logoUrl: "https://upload.wikimedia.org/wikipedia/en/a/ae/New_York_Rangers.svg",
          score: 0
        },
        awayTeam: { 
          name: "Bruins", 
          city: "Boston", 
          abbreviation: "BOS", 
          color: "#FFB81C", 
          logo: "🐻",
          logoUrl: "https://upload.wikimedia.org/wikipedia/en/1/12/Boston_Bruins.svg",
          score: 0
        },
        startTime: "7:00 PM ET",
        venue: "Madison Square Garden"
      }
    ];
  }
};

export const fetchLiveGameData = async (
  period: number, 
  timeRemaining: string, 
  homeTeam: { name: string; city: string; abbreviation: string }, 
  awayTeam: { name: string; city: string; abbreviation: string }
): Promise<{ 
  events: Partial<GameEvent>[], 
  nextFaceoffTrigger: boolean,
  currentPossession: { team: 'home' | 'away', position: Position } | null,
  isPowerPlay?: boolean,
  penaltyClocks?: { team: 'home' | 'away', time: string, player?: string }[],
  strength?: '5v5' | '4v4' | '3v3' | 'PP' | 'PK',
  realTimeSync: boolean,
  liveState?: {
    homeScore: number;
    awayScore: number;
    period: number;
    timeRemaining: string;
    status?: string;
  },
  groundingUrls?: { uri: string; title: string }[]
}> => {
  try {
    const searchPrompt = `Search for the latest live play-by-play and current score for the NHL game: ${awayTeam.city} ${awayTeam.name} vs ${homeTeam.city} ${homeTeam.name}.
    Current user-side state: Period ${period}, ${timeRemaining} remaining.

    If the game is CURRENTLY LIVE:
    1. Return the actual current score, period, time remaining, and status (e.g., 'Live', 'Intermission', 'Final').
    2. Return the most recent 1-3 play-by-play events that have occurred since the last update.
    3. Set 'foundRealData' to true.

    If the game is NOT currently live (e.g., hasn't started, already finished, or no live feed found), SIMULATE a highly realistic 8-second sequence of hockey play.
    Simulation Rules:
    1. Generate 2-4 logical events (e.g., Defensive Takeaway -> Pass -> Wing Shot -> Goalie Save).
    2. Ensure positions (C, LW, RW, LD, RD, G) match the actions.
    3. Descriptions should be professional and exciting.
    4. Set 'foundRealData' to false.
    5. Set status to 'Simulation'.
    
    Event types: GOAL, ASSIST, HIT, SHOT, BLOCKED_SHOT, TAKEAWAY, PASS, GIVEAWAY, SAVE, GOAL_AGAINST, PENALTY, MINOR_PENALTY, MAJOR_PENALTY, MISCONDUCT, SO_GOAL.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  team: { type: Type.STRING, enum: ['home', 'away'] },
                  position: { type: Type.STRING, enum: ['C', 'LW', 'RW', 'LD', 'RD', 'G'] },
                  type: { type: Type.STRING, enum: ['GOAL', 'ASSIST', 'HIT', 'SHOT', 'BLOCKED_SHOT', 'TAKEAWAY', 'PASS', 'GIVEAWAY', 'SAVE', 'GOAL_AGAINST', 'PENALTY', 'MINOR_PENALTY', 'MAJOR_PENALTY', 'MISCONDUCT', 'SO_GOAL'] },
                  description: { type: Type.STRING },
                  gameTime: { type: Type.STRING }
                },
                required: ['team', 'position', 'type', 'description', 'gameTime']
              }
            },
            nextFaceoffTrigger: { type: Type.BOOLEAN },
            currentPossession: {
              type: Type.OBJECT,
              properties: {
                team: { type: Type.STRING, enum: ['home', 'away'] },
                position: { type: Type.STRING, enum: ['C', 'LW', 'RW', 'LD', 'RD', 'G'] }
              },
              required: ['team', 'position']
            },
            foundRealData: { type: Type.BOOLEAN },
            isPowerPlay: { type: Type.BOOLEAN, description: "Whether a power play is currently active for either team" },
            penaltyClocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  team: { type: Type.STRING, enum: ['home', 'away'] },
                  time: { type: Type.STRING, description: "Time remaining in the penalty (e.g., '1:45')" },
                  player: { type: Type.STRING, description: "Name of the player in the penalty box" }
                },
                required: ['team', 'time']
              }
            },
            liveState: {
              type: Type.OBJECT,
              properties: {
                homeScore: { type: Type.INTEGER },
                awayScore: { type: Type.INTEGER },
                period: { type: Type.INTEGER },
                timeRemaining: { type: Type.STRING },
                status: { type: Type.STRING }
              }
            }
          },
          required: ['events', 'nextFaceoffTrigger', 'currentPossession', 'foundRealData']
        }
      }
    });

    const data = JSON.parse(response.text || '{"events":[], "nextFaceoffTrigger": false, "currentPossession": null, "foundRealData": false}');
    
    // Extract grounding URLs
    const groundingUrls: { uri: string; title: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          groundingUrls.push({ uri: chunk.web.uri, title: chunk.web.title });
        }
      });
    }
    
    const eventsWithPoints = data.events.map((e: any) => {
      let points = 0;
      if (e.position === 'G') {
        if (e.type === 'SAVE') points = SCORING_RULES.GOALIE.SAVE;
        else if (e.type === 'GOAL_AGAINST') points = SCORING_RULES.GOALIE.GOAL_AGAINST;
        else if (e.type === 'PENALTY' || e.type === 'MINOR_PENALTY') points = SCORING_RULES.SKATER.MINOR_PENALTY;
        else if (e.type === 'MAJOR_PENALTY') points = SCORING_RULES.SKATER.MAJOR_PENALTY;
        else if (e.type === 'MISCONDUCT') points = SCORING_RULES.SKATER.MISCONDUCT;
        else points = (SCORING_RULES.SKATER as any)[e.type] || 0;
      } else {
        points = (SCORING_RULES.SKATER as any)[e.type] || 0;
        if (e.type === 'SO_GOAL') points = SCORING_RULES.SKATER.GOAL;
      }
      return { ...e, points, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
    });

    return { 
      events: eventsWithPoints, 
      nextFaceoffTrigger: data.nextFaceoffTrigger || eventsWithPoints.some((e: any) => e.type === 'GOAL' || e.type === 'PENALTY' || e.type === 'MINOR_PENALTY' || e.type === 'MAJOR_PENALTY' || e.type === 'MISCONDUCT' || e.type === 'SO_GOAL'),
      currentPossession: data.currentPossession,
      isPowerPlay: data.isPowerPlay || (data.penaltyClocks && data.penaltyClocks.length > 0) || eventsWithPoints.some((e: any) => e.type.includes('PENALTY')),
      penaltyClocks: data.penaltyClocks,
      strength: data.strength || (data.isPowerPlay ? 'PP' : '5v5'),
      realTimeSync: data.foundRealData,
      liveState: data.liveState,
      groundingUrls: groundingUrls.length > 0 ? groundingUrls : undefined
    };
  } catch (error) {
    console.error("Error fetching events via search:", error);
    return { events: [], nextFaceoffTrigger: false, currentPossession: null, realTimeSync: false };
  }
};