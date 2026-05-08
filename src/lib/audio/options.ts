import { z } from 'zod';
import type { MasteringOptions, MasteringPreset } from './types';

export const masteringOptionsSchema = z.object({
  preset: z.enum(['streaming', 'loud', 'podcast', 'warm']),
  targetLufs: z.number().min(-24).max(-6),
  ceilingDb: z.number().min(-3).max(-0.1),
  intensity: z.number().min(0).max(1),
  warmth: z.number().min(0).max(1),
  stereoWidth: z.number().min(0.65).max(1.45)
});

export const presetOptions: Record<MasteringPreset, MasteringOptions> = {
  streaming: {
    preset: 'streaming',
    targetLufs: -14,
    ceilingDb: -1,
    intensity: 0.55,
    warmth: 0.35,
    stereoWidth: 1.08
  },
  loud: {
    preset: 'loud',
    targetLufs: -10,
    ceilingDb: -0.8,
    intensity: 0.82,
    warmth: 0.28,
    stereoWidth: 1.12
  },
  podcast: {
    preset: 'podcast',
    targetLufs: -16,
    ceilingDb: -1.5,
    intensity: 0.64,
    warmth: 0.22,
    stereoWidth: 0.95
  },
  warm: {
    preset: 'warm',
    targetLufs: -13,
    ceilingDb: -1,
    intensity: 0.48,
    warmth: 0.76,
    stereoWidth: 1.04
  }
};

export function parseMasteringOptions(options: MasteringOptions): MasteringOptions {
  return masteringOptionsSchema.parse(options);
}
