export type Topic = 'Video Games' | 'Movies' | 'Music' | 'TV';
export type Phase = 'lobby' | 'question' | 'reveal' | 'finished';
export interface PlayerView { id: string; nickname: string; score: number; connected: boolean; isHost: boolean; hasAnswered: boolean }
export interface RoomView {
  code: string; phase: Phase; round: number; totalRounds: number; deadline: number | null;
  question: null | { id: number; topic: Topic; prompt: string; options: string[] };
  reveal: null | { correctIndex: number; answers: Record<string, number | null> };
  players: PlayerView[]; winners: string[]; isHost: boolean; selfId: string;
}
export interface Ack<T = unknown> { ok: boolean; data?: T; error?: string }
