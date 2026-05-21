import SwiftUI

struct WorkoutDetailView: View {
    @EnvironmentObject var store: WorkoutSessionStore
    let workout: WatchWorkout
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text("DETALHES DO TREINO")
                        .font(.system(.caption2, design: .rounded))
                        .fontWeight(.bold)
                        .foregroundColor(.themeOnSurfaceVariant)
                        .tracking(1.0)
                    
                    Text(workout.name)
                        .font(.system(.title3, design: .rounded))
                        .fontWeight(.black)
                        .foregroundColor(.white)
                }
                .padding(.horizontal)
                
                // Exercises List
                VStack(spacing: 8) {
                    if workout.exercises.isEmpty {
                        Text("Sem exercícios cadastrados.")
                            .font(.system(.footnote, design: .rounded))
                            .foregroundColor(.themeOnSurfaceVariant)
                            .padding()
                    } else {
                        ForEach(workout.exercises) { exercise in
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text(exercise.name)
                                        .font(.system(.body, design: .rounded).bold())
                                        .foregroundColor(.white)
                                    Spacer()
                                    Text(exercise.muscleGroup.uppercased())
                                        .font(.system(.caption2, design: .monospaced))
                                        .foregroundColor(.themePrimary)
                                }
                                
                                Text("\(exercise.sets.count) séries • \(exercise.restTime)s desc")
                                    .font(.system(.footnote, design: .rounded))
                                    .foregroundColor(.themeOnSurfaceVariant)
                            }
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(Color.themeSurface)
                            )
                        }
                    }
                }
                .padding(.horizontal)
                
                // Start Button
                Button(action: {
                    store.startWorkout(workout)
                }) {
                    HStack {
                        Image(systemName: "play.fill")
                        Text("Iniciar Treino")
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.themePrimary)
                    .foregroundColor(Color(red: 22/255, green: 30/255, blue: 0))
                    .font(.system(.body, design: .rounded).bold())
                    .cornerRadius(12)
                }
                .buttonStyle(PlainButtonStyle())
                .padding(.horizontal)
                .padding(.top, 8)
            }
            .padding(.vertical)
        }
        .background(Color.themeBackground.ignoresSafeArea())
        .navigationTitle("Treino")
    }
}

struct WorkoutDetailView_Previews: PreviewProvider {
    static var previews: some View {
        let store = WorkoutSessionStore()
        let mockWorkout = WatchWorkout(id: "1", name: "Peito e Tríceps", exercises: [
            WatchExercise(id: "e1", name: "Supino Reto", sets: [], restTime: 90, muscleGroup: "peito")
        ])
        return WorkoutDetailView(workout: mockWorkout)
            .environmentObject(store)
    }
}
