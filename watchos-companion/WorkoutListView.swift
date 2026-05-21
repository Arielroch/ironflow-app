import SwiftUI

struct WorkoutListView: View {
    @EnvironmentObject var store: WorkoutSessionStore
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                Text("Seus Treinos")
                    .font(.system(.headline, design: .rounded))
                    .foregroundColor(.white)
                    .padding(.horizontal)
                
                if store.workouts.isEmpty {
                    Text("Nenhum treino disponível. Crie rotinas no iPhone.")
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(.themeOnSurfaceVariant)
                        .multilineTextAlignment(.center)
                        .padding()
                } else {
                    ForEach(store.workouts) { workout in
                        NavigationLink(destination: WorkoutDetailView(workout: workout)) {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(workout.name)
                                        .font(.system(.body, design: .rounded))
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                        .lineLimit(2)
                                    
                                    Text("\(workout.exercises.count) Exercícios")
                                        .font(.system(.footnote, design: .monospaced))
                                        .foregroundColor(Color.themePrimary)
                                }
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.footnote)
                                    .foregroundColor(.themeOnSurfaceVariant)
                            }
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.themeSurface)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color.themePrimary.opacity(0.15), lineWidth: 1)
                                    )
                            )
                        }
                        .buttonStyle(PlainButtonStyle())
                        .padding(.horizontal)
                    }
                }
            }
            .padding(.vertical)
        }
        .background(Color.themeBackground.ignoresSafeArea())
        .navigationTitle("IronFlow")
    }
}

struct WorkoutListView_Previews: PreviewProvider {
    static var previews: some View {
        WorkoutListView()
            .environmentObject(WorkoutSessionStore())
    }
}
