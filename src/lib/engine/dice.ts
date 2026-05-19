// ═══════════════════════════════════════════════════════
// CARDTAN — Dice System
// Framework-free pure TypeScript. No Svelte imports.
// ═══════════════════════════════════════════════════════

import type { EventDieResult, DiceRoll } from './types.js';

export const EVENT_FACES: EventDieResult[] = [
  'tournament',
  'harvest',
  'brigand',
  'trade',
  'good_year',
  'plague',
];

export function rollProductionDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollEventDie(): EventDieResult {
  return EVENT_FACES[Math.floor(Math.random() * 6)];
}

export function rollDice(): DiceRoll {
  return {
    production: rollProductionDie(),
    event: rollEventDie(),
  };
}

export function eventLabel(event: EventDieResult): string {
  const labels: Record<EventDieResult, string> = {
    tournament: 'Tournament',
    harvest: 'Harvest',
    brigand: 'Brigand Attack',
    trade: 'Trade Advantage',
    good_year: 'Good Year',
    plague: 'Plague',
  };
  return labels[event];
}

export function eventDescription(event: EventDieResult): string {
  const desc: Record<EventDieResult, string> = {
    tournament: 'Compare Strength — winner gains the Strength Token (+1 VP).',
    harvest: 'All Grain regions gain +1 for both players.',
    brigand: 'Players with >7 total resources lose all Gold and Wool.',
    trade: 'Compare Trade scores — winner gains the Trade Token (+1 VP).',
    good_year: 'Both players draw 1 free card from any stack.',
    plague: 'Both players lose 1 random resource.',
  };
  return desc[event];
}
