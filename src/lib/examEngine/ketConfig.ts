export interface KETFieldConfig {
  key: string;   
  label: string; 
  max: number;   
  step: number;  
}

export const KET_CONFIG: Record<string, KETFieldConfig[]> = {
  reading: [
    { key: 'Part 1', label: 'Part 1', max: 6, step: 1 },
    { key: 'Part 2', label: 'Part 2', max: 7, step: 1 },
    { key: 'Part 3', label: 'Part 3', max: 5, step: 1 },
    { key: 'Part 4', label: 'Part 4', max: 6, step: 1 },
    { key: 'Part 5', label: 'Part 5', max: 6, step: 1 },
  ],
  writing: [
    { key: 'Part 6 - Content', label: 'Part 6 - Content', max: 5, step: 1 },
    { key: 'Part 6 - Organisation', label: 'Part 6 - Organisation', max: 5, step: 1 },
    { key: 'Part 6 - Language', label: 'Part 6 - Language', max: 5, step: 1 },
    { key: 'Part 7 - Content', label: 'Part 7 - Content', max: 5, step: 1 },
    { key: 'Part 7 - Organisation', label: 'Part 7 - Organisation', max: 5, step: 1 },
    { key: 'Part 7 - Language', label: 'Part 7 - Language', max: 5, step: 1 },
  ],
  listening: [
    { key: 'Part 1', label: 'Part 1', max: 5, step: 1 },
    { key: 'Part 2', label: 'Part 2', max: 5, step: 1 },
    { key: 'Part 3', label: 'Part 3', max: 5, step: 1 },
    { key: 'Part 4', label: 'Part 4', max: 5, step: 1 },
    { key: 'Part 5', label: 'Part 5', max: 5, step: 1 },
  ],
  speaking: [
    { key: 'Grammar and Vocabulary', label: 'Grammar and Vocabulary', max: 5, step: 0.5 },
    { key: 'Pronunciation', label: 'Pronunciation', max: 5, step: 0.5 },
    { key: 'Interactive Communication', label: 'Interactive Communication', max: 5, step: 0.5 },
    { key: 'Global Achievement', label: 'Global Achievement', max: 5, step: 0.5 },
  ]
};