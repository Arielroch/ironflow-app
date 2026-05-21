import SwiftUI

struct ActiveWorkoutView: View {
    @EnvironmentObject var store: WorkoutSessionStore
    @State private var showingAlert = false
    
    var body: some View {
        ZStack {
            Color.themeBackground.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 12) {
                    // Header Timer
                    HStack {
                        Image(systemName: "timer")
                            .foregroundColor(Color.themePrimary)
                        Text(formatSeconds(store.durationSeconds))
                            .font(.system(.body, design: .monospaced))
                            .fontWeight(.black)
                        Spacer()
                        Text(store.activeWorkout?.name.prefix(10) ?? "")
                            .font(.system(.footnote, design: .rounded))
                            .foregroundColor(.themeOnSurfaceVariant)
                    }
                    .padding(.horizontal)
                    
                    if let workout = store.activeWorkout, !workout.exercises.isEmpty {
                        let exercise = workout.exercises[store.activeExerciseIndex]
                        
                        // Active Exercise Panel
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text("\(store.activeExerciseIndex + 1)/\(workout.exercises.count)")
                                    .font(.system(.caption2, design: .monospaced))
                                    .foregroundColor(Color.themePrimary)
                                Spacer()
                                Text("\(exercise.restTime)s rest")
                                    .font(.system(.caption2, design: .monospaced))
                                    .foregroundColor(.themeOnSurfaceVariant)
                            }
                            
                            Text(exercise.name)
                                .font(.system(.body, design: .rounded))
                                .fontWeight(.black)
                                .foregroundColor(.white)
                                .lineLimit(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding()
                        .background(Color.themeSurface)
                        .cornerRadius(12)
                        .padding(.horizontal)
                        
                        // Sets List
                        VStack(spacing: 8) {
                            ForEach(0..<exercise.sets.count, id: \.self) { setIndex in
                                let set = exercise.sets[setIndex]
                                Button(action: {
                                    if !set.isCompleted {
                                        store.completeSet(exerciseId: exercise.id, setIndex: setIndex)
                                    }
                                }) {
                                    HStack {
                                        Text("\(setIndex + 1)")
                                            .font(.system(.body, design: .monospaced))
                                            .fontWeight(.black)
                                            .foregroundColor(set.isCompleted ? .themeOnSurfaceVariant.opacity(0.6) : Color.themePrimary)
                                            .frame(width: 20)
                                        
                                        Spacer()
                                        
                                        Text("\(cleanDouble(set.weight)) kg x \(set.reps)")
                                            .font(.system(.body, design: .rounded))
                                            .fontWeight(.bold)
                                            .foregroundColor(set.isCompleted ? .themeOnSurfaceVariant.opacity(0.6) : .white)
                                        
                                        Spacer()
                                        
                                        Image(systemName: set.isCompleted ? "checkmark.circle.fill" : "circle")
                                            .foregroundColor(set.isCompleted ? .green : .themeOnSurfaceVariant.opacity(0.4))
                                            .font(.body)
                                    }
                                    .padding()
                                    .background(
                                        RoundedRectangle(cornerRadius: 12)
                                            .fill(set.isCompleted ? Color.themeBackground.opacity(0.6) : Color.themeSurface)
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 12)
                                                    .stroke(set.isCompleted ? Color.clear : Color.themePrimary.opacity(0.1), lineWidth: 1)
                                            )
                                    )
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .padding(.horizontal)
                        
                        // Navigation Between Exercises
                        HStack(spacing: 12) {
                            Button(action: {
                                if store.activeExerciseIndex > 0 {
                                    store.activeExerciseIndex -= 1
                                }
                            }) {
                                Image(systemName: "arrow.left")
                                    .padding()
                                    .frame(maxWidth: .infinity)
                                    .background(Color.themeSurface)
                                    .cornerRadius(10)
                            }
                            .disabled(store.activeExerciseIndex == 0)
                            .buttonStyle(PlainButtonStyle())
                            
                            Button(action: {
                                if store.activeExerciseIndex < workout.exercises.count - 1 {
                                    store.activeExerciseIndex += 1
                                }
                            }) {
                                Image(systemName: "arrow.right")
                                    .padding()
                                    .frame(maxWidth: .infinity)
                                    .background(Color.themeSurface)
                                    .cornerRadius(10)
                            }
                            .disabled(store.activeExerciseIndex == workout.exercises.count - 1)
                            .buttonStyle(PlainButtonStyle())
                        }
                        .padding(.horizontal)
                        
                        // Finish Button
                        Button(action: {
                            store.finishWorkout()
                        }) {
                            HStack {
                                Image(systemName: "checkmark.seal.fill")
                                Text("Finalizar")
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
                        
                        // Cancel Button
                        Button(action: {
                            showingAlert = true
                        }) {
                            Text("Abandonar Treino")
                                .font(.system(.caption, design: .rounded))
                                .foregroundColor(.red.opacity(0.8))
                                .padding(.vertical, 8)
                        }
                        .buttonStyle(PlainButtonStyle())
                        .alert(isPresented: $showingAlert) {
                            Alert(
                                title: Text("Abandonar?"),
                                message: Text("Seu progresso atual não será salvo."),
                                primaryButton: .destructive(Text("Abandonar")) {
                                    store.cancelWorkout()
                                },
                                secondaryButton: .cancel(Text("Voltar"))
                            )
                        }
                    }
                }
                .padding(.vertical)
            }
            
            // Rest Timer Overlay
            if store.showRestTimer {
                RestTimerView()
                    .environmentObject(store)
                    .transition(.move(edge: .bottom))
                    .zIndex(10)
            }
        }
        .navigationBarHidden(true)
    }
    
    // Formatting Helpers
    private func formatSeconds(_ totalSeconds: Int) -> String {
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60
        if hours > 0 {
            return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%02d:%02d", minutes, seconds)
        }
    }
    
    private func cleanDouble(_ val: Double) -> String {
        let formatter = NumberFormatter()
        formatter.minimumFractionDigits = 0
        formatter.maximumFractionDigits = 1
        return formatter.string(from: NSNumber(value: val)) ?? "\(val)"
    }
}

struct ActiveWorkoutView_Previews: PreviewProvider {
    static var previews: some View {
        ActiveWorkoutView()
            .environmentObject(WorkoutSessionStore())
    }
}
