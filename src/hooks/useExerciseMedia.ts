import { useState, useCallback, useEffect } from 'react';
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
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => {
    setVersion(v => v + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !exerciseId) {
      setMedia(null);
      return;
    }

    let isCurrent = true;
    
    async function fetchMedia() {
      setLoading(true);
      setMedia(null); // Limpa a mídia antiga imediatamente para não mostrar o gif errado enquanto carrega
      
      // Simula um pequeno atraso de rede para feedback visual da interface
      await new Promise(r => setTimeout(r, 150));
      
      if (!isCurrent) return;
      
      let result: ExerciseMedia | null = null;
      
      if (MEDIA_MAP[exerciseId]) {
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
    }

    fetchMedia();

    return () => {
      isCurrent = false;
    };
  }, [enabled, exerciseId, version]);

  return { media, loading, load: reload };
}

