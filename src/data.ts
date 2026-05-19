import { Workout, Exercise, UserStats } from './types';

export const MOCK_EXERCISES: Exercise[] = [
  {
    id: 'ex1',
    name: 'Supino Reto com Barra',
    muscleGroup: 'Peitoral',
    type: 'Compound',
    category: 'Strength',
    restTime: 120,
    sets: [
      { weight: 100, reps: 10, isCompleted: true },
      { weight: 100, reps: '10', isCompleted: false },
      { weight: 100, reps: '10', isCompleted: false },
    ],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmrZxE0S9-4OAR6h2l318DsFCXkAR69Db5u1u9UOLmUbiKEgoxy5dk4EUI7WZthKwNzn1UBdIkCdCxkt93qmprjbVH0hCuZGVhfvswBHLlULIPCjyNV8uNJUzErmRu5JaVWXU4em2U3rHJRnYu65gWhRDuba1smvSCqs2GigskoggxbGSGipUqt-pQqsfAtLyB2rFJ4MuDOa9yJ3A-hAOoMu2m9XsnqHgG8fCfZSsVmKuykZNWQ6cWfi2f3Fw56Xhf6Lq_ECZX3R62',
    description: 'Deite-se no banco com os pés firmes no chão. Segure a barra um pouco mais largo que a largura dos ombros. Abaixe a barra até o meio do peito e empurre de volta até a extensão total.',
    focusMuscle: 'Peitoral Maior'
  },
  {
    id: 'ex2',
    name: 'Crucifixo Inclinado com Halteres',
    muscleGroup: 'Peitoral',
    type: 'Isolation',
    category: 'Hypertrophy',
    restTime: 90,
    sets: [],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAB4EUAz6yDCeoTbAk9o5NP_gEm9pxcSJJYod4BBsH9z6csUMhLAVTDLK1BDLKqa7p9i1IiVSxEsos364d6I26hksaZ0I7qJ0KVBCo3NKwMBTNwxkvF8uMZUufS9HPoGSLH_7d5_tSN1U5zQZCsZ2EOJDOV7lYHLksZcGHTDf5XRDrxbl5CTIMDXR_PmR_rZfmEsuiLI_5rv33xDMVNxyahrEhtHAOuYMPlmrNEgwyQYxrZLhbxzcwT8_Ymq6MZ5zoo-EA3g0YvEby0',
    description: 'Ajuste o banco para 30-45 graus. Abaixe os pesos em arco até sentir um alongamento e, em seguida, aperte de volta ao topo mantendo uma leve flexão nos cotovelos.',
    focusMuscle: 'Peitoral Superior'
  },
  {
    id: 'ex3',
    name: 'Levantamento Terra Convencional',
    muscleGroup: 'Costas',
    type: 'Compound',
    category: 'Power',
    restTime: 180,
    sets: [],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhknnXO8Z8jydOMddsWf3epxKXXN_wetVFAYPb8Y3GJ0AQIemZCxVJV6JZutveENT4Fxw7vLirJhB4L9TWOp7vKbTvay_K6n4W8fq5SZ0lxoP9Zdwoyq_x3HCxJKiGlI1qkM-GciRLiqdrTrBnF8OWTSKy76yhSNaPUI2I-fTY4rBsoujWwyGOx69G-DMGlAPOxCo0TiyZPjYVo_GNsu6FSqCWecPOgIFAzN4Uvit2JePKDG1mfsLPyL6nqUpuA8vxx1cDe_7J84dW',
    description: 'Fique de pé com os pés na largura dos quadris. Incline-se nos quadris para agarrar a barra. Mantendo as costas retas, empurre o chão para ficar de pé.',
    focusMuscle: 'Cadeia Posterior'
  },
  {
    id: 'ex4',
    name: 'Pulley Frente com Pegada Larga',
    muscleGroup: 'Costas',
    type: 'Isolation',
    category: 'Width',
    restTime: 90,
    sets: [],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbzSbS-JFSkUtQ8tREzQ3qqEg_GeSM-CFyB68EiXu_v6DnJO3TDSgth_3ItsL8OpIviTvYJllwnLzQT_1HvpRvqESEPiCWDndT7eV2eBH8XqSlJXNYjEbDhf_VmfFUwe92iETDG9zKQH5LBylYGBzaOdqyCt1JXsLuQyT_J0SLsnqHWeTslXWulDGzP9Y2JgRZzKweIdsy2QKB3A7FR93umTL-Cmc3zWfeP2glMTcE3pyVcYeyl02sUa3WDASy2LpXmFGPXPNtvnAh',
    description: 'Puxe a barra para baixo até o peito superior enquanto inclina ligeiramente para trás. Foque em puxar com os cotovelos e apertar o grande dorsal na parte inferior.',
    focusMuscle: 'Grande Dorsal'
  }
];

export const MOCK_WORKOUTS: Workout[] = [
  {
    id: 'w1',
    name: 'Push Day A',
    exercises: [MOCK_EXERCISES[0], MOCK_EXERCISES[1]],
    lastSessionDate: '24 OUT',
    avgDuration: 72
  },
  {
    id: 'w2',
    name: 'Pull Hipertrofia',
    exercises: [MOCK_EXERCISES[2], MOCK_EXERCISES[3]],
    lastSessionDate: '21 OUT',
    avgDuration: 65
  },
  {
    id: 'w3',
    name: 'Costas e Core',
    exercises: [],
    lastSessionDate: '19 OUT',
    avgDuration: 80
  },
  {
    id: 'w4',
    name: 'Treino de Impacto',
    exercises: [],
    lastSessionDate: 'NUNCA'
  }
];

export const MOCK_USER_STATS: UserStats = {
  weight: 84.2,
  weightChange: '+0.4 KG ESTA SEMANA',
  streak: 14,
  weeklyVolume: [
    { day: 'S', value: 40 },
    { day: 'T', value: 65 },
    { day: 'Q', value: 90, isToday: true },
    { day: 'Q', value: 30 },
    { day: 'S', value: 55 },
    { day: 'S', value: 75 },
    { day: 'D', value: 20 },
  ],
  userImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVDD-8K1jOj_KzSfvujkoTchZzAnrO305h0gbZPbYqKYSd1gZnJ6kX-dKQxFzcN3SeskbJ2ewyQlJAdfIaavDHLiB-CZV8ZdnYEuZkllLCtKKeIbPbuAiUuP4zftHEiJ8BXXdGcl0r_YlgJiYAsY_o_pM_0K9j4O3hVV8r5U-YkeFEGTwNBaLG4P5vhtaVSdjh-57T0lL9XD4IsVh7t1zJw9Pnmw79HxqWbmupBUDDx7tVr-Ze9G4yEGiMAJuC2vYZzcY_HouzkHM7'
};

