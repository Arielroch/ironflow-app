import SwiftUI

struct RestTimerView: View {
    @EnvironmentObject var store: WorkoutSessionStore
    
    var body: some View {
        VStack(spacing: 8) {
            Text("TEMPO DE DESCANSO")
                .font(.system(.caption2, design: .rounded))
                .fontWeight(.bold)
                .foregroundColor(.themeOnSurfaceVariant)
                .tracking(1.5)
            
            ZStack {
                // Circle Progress
                Circle()
                    .stroke(Color.themeSurface, lineWidth: 8)
                    .frame(width: 110, height: 110)
                
                Circle()
                    .trim(from: 0.0, to: CGFloat(store.restTimeRemaining) / CGFloat(store.activeRestTime))
                    .stroke(
                        Color.themePrimary,
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .frame(width: 110, height: 110)
                    .rotationEffect(Angle(degrees: -90))
                    .animation(.linear(duration: 1.0), value: store.restTimeRemaining)
                
                VStack(spacing: 2) {
                    Text("\(store.restTimeRemaining)")
                        .font(.system(.title2, design: .monospaced))
                        .fontWeight(.black)
                        .foregroundColor(.white)
                    Text("s")
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(.themeOnSurfaceVariant)
                }
            }
            .padding(.vertical, 4)
            
            HStack(spacing: 8) {
                Button(action: {
                    store.restTimeRemaining += 30
                    store.activeRestTime += 30
                }) {
                    Text("+30s")
                        .font(.system(.caption, design: .rounded).bold())
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity)
                        .background(Color.themeSurfaceVariant)
                        .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: {
                    store.showRestTimer = false
                }) {
                    Text("Pular")
                        .font(.system(.caption, design: .rounded).bold())
                        .foregroundColor(.red)
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity)
                        .background(Color.themeSurfaceVariant)
                        .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.themeBackground.edgesIgnoringSafeArea(.all))
    }
}

struct RestTimerView_Previews: PreviewProvider {
    static var previews: some View {
        let store = WorkoutSessionStore()
        store.restTimeRemaining = 45
        store.activeRestTime = 90
        return RestTimerView()
            .environmentObject(store)
    }
}
