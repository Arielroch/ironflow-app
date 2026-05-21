import SwiftUI

@main
struct IronFlowWatchApp: App {
    @StateObject private var sessionStore = WorkoutSessionStore()
    
    var body: some Scene {
        WindowGroup {
            NavigationView {
                if sessionStore.isActive {
                    ActiveWorkoutView()
                        .environmentObject(sessionStore)
                } else {
                    WorkoutListView()
                        .environmentObject(sessionStore)
                }
            }
        }
    }
}
