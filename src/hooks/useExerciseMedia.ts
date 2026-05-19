import { useState, useCallback } from 'react';
import { MEDIA_MAP } from '../mediaMap';

export interface ExerciseMedia {
  videoUrl: string;
  imageUrl: string;
  description: string;
  howTo: string[];
}

// Derive slug from exercise name (used previously, keeping just in case but we lookup by id now)
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove diacritics
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function useExerciseMedia(muscleGroup: string, exerciseName: string, enabled: boolean, exerciseId?: string) {
  const [media, setMedia] = useState<ExerciseMedia | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || loading || media) return;
    setLoading(true);
    
    // Simulate slight network delay for UI feedback
    await new Promise(r => setTimeout(r, 150));
    
    let result: ExerciseMedia | null = null;
    
    if (exerciseId && MEDIA_MAP[exerciseId]) {
      const data = MEDIA_MAP[exerciseId];
      if (data.videoUrl || data.imageUrl) {
        result = {
          videoUrl: data.videoUrl,
          imageUrl: data.imageUrl,
          description: '',
          howTo: []
        };
      }
    }
    
    setMedia(result);
    setLoading(false);
  }, [enabled, exerciseId, loading, media]);

  return { media, loading, load };
}

