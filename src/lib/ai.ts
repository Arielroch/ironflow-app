import { Exercise, Workout } from '../types';
import { getExerciseLibrary, generateId } from '../store';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface AiWorkoutPreferences {
  goal: string;
  frequency: number;
  experience: string;
  equipment: string;
}

export async function generateWorkoutsWithAI(
  apiKey: string,
  prefs: AiWorkoutPreferences
): Promise<Workout[]> {
  const library = getExerciseLibrary();
  
  // We send a stripped-down version of the library to save tokens
  const availableExercises = library.map(ex => ({
    id: ex.id,
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    type: ex.type
  }));

  const systemPrompt = `
You are a world-class personal trainer. 
Based on the user's preferences, create a complete workout routine split across multiple days.
Return ONLY a valid JSON array of objects, with NO markdown formatting, NO backticks, and NO additional text. 
Each object in the array represents a Workout day and MUST follow this exact TypeScript interface:
{
  "name": string, // e.g. "Treino A - Peito e Tríceps"
  "exercises": [
    {
      "id": string, // MUST be a valid ID from the provided exercise library
      "sets": [
        { "weight": 0, "reps": "10-12" }, // provide 3-4 sets per exercise
        { "weight": 0, "reps": "10-12" },
        { "weight": 0, "reps": "10-12" }
      ],
      "restTime": number // rest time in seconds, usually 60, 90 or 120
    }
  ]
}

User Preferences:
- Goal: ${prefs.goal}
- Frequency: ${prefs.frequency} days per week
- Experience Level: ${prefs.experience}
- Equipment: ${prefs.equipment}

Available Exercise Library (USE ONLY THESE IDs):
${JSON.stringify(availableExercises)}
`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Falha ao conectar com a IA');
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Parse the generated JSON
    const parsedWorkouts = JSON.parse(textResponse);

    if (!Array.isArray(parsedWorkouts)) {
      throw new Error("A IA não retornou um formato válido.");
    }

    // Reconstruct full Workout objects
    const finalWorkouts: Workout[] = parsedWorkouts.map(w => {
      const fullExercises: Exercise[] = w.exercises.map((exStub: any) => {
        const originalEx = library.find(e => e.id === exStub.id);
        if (!originalEx) return null;
        return {
          ...originalEx,
          sets: exStub.sets.map((s: any) => ({ weight: s.weight || 0, reps: s.reps || 10, isCompleted: false })),
          restTime: exStub.restTime || 90
        };
      }).filter(Boolean) as Exercise[];

      return {
        id: generateId(),
        name: w.name,
        exercises: fullExercises,
        lastSessionDate: 'NUNCA'
      };
    });

    return finalWorkouts;
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error(error.message || "Erro desconhecido ao gerar o treino.");
  }
}
