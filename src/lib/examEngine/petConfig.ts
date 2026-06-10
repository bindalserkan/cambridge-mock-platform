import { KETFieldConfig } from './ketConfig';

// Reusing the same interface structure for strict configuration consistency
export const PET_CONFIG: Record<string, KETFieldConfig[]> = {
  reading: [
    { key: 'Part 1', label: 'Part 1', max: 5, step: 1 },
    { key: 'Part 2', label: 'Part 2', max: 5, step: 1 },
    { key: 'Part 3', label: 'Part 3', max: 5, step: 1 },
    { key: 'Part 4', label: 'Part 4', max: 5, step: 1 },
    { key: 'Part 5', label: 'Part 5', max: 6, step: 1 },
    { key: 'Part 6', label: 'Part 6', max: 6, step: 1 },
  ],
  writing: [
    { key: 'Part 1 - Content', label: 'Part 1 - Content', max: 5, step: 1 },
    { key: 'Part 1 - Communicative Achievement', label: 'Part 1 - Communicative Achievement', max: 5, step: 1 },
    { key: 'Part 1 - Organisation', label: 'Part 1 - Organisation', max: 5, step: 1 },
    { key: 'Part 1 - Language', label: 'Part 1 - Language', max: 5, step: 1 },
    { key: 'Part 2 - Content', label: 'Part 2 - Content', max: 5, step: 1 },
    { key: 'Part 2 - Communicative Achievement', label: 'Part 2 - Communicative Achievement', max: 5, step: 1 },
    { key: 'Part 2 - Organisation', label: 'Part 2 - Organisation', max: 5, step: 1 },
    { key: 'Part 2 - Language', label: 'Part 2 - Language', max: 5, step: 1 },
  ],
  listening: [
    { key: 'Part 1', label: 'Part 1', max: 7, step: 1 },
    { key: 'Part 2', label: 'Part 2', max: 6, step: 1 },
    { key: 'Part 3', label: 'Part 3', max: 6, step: 1 },
    { key: 'Part 4', label: 'Part 4', max: 6, step: 1 },
  ],
  speaking: [
    { key: 'Grammar and Vocabulary', label: 'Grammar and Vocabulary', max: 5, step: 0.5 },
    { key: 'Discourse Management', label: 'Discourse Management', max: 5, step: 0.5 },
    { key: 'Pronunciation', label: 'Pronunciation', max: 5, step: 0.5 },
    { key: 'Interactive Communication', label: 'Interactive Communication', max: 5, step: 0.5 },
    { key: 'Global Achievement', label: 'Global Achievement', max: 5, step: 0.5 },
  ]
};