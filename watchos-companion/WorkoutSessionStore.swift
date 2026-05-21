import Foundation
import Combine
import WatchConnectivity
import SwiftUI

// MARK: - Models
struct WatchWorkout: Identifiable, Codable {
    var id: String
    var name: String
    var exercises: [WatchExercise]
}

struct WatchExercise: Identifiable, Codable {
    var id: String
    var name: String
    var sets: [WatchWorkoutSet]
    var restTime: Int
    var muscleGroup: String
}

struct WatchWorkoutSet: Identifiable, Codable {
    var id: UUID = UUID()
    var weight: Double
    var reps: Int
    var isCompleted: Bool
}

struct WatchWorkoutSession: Codable {
    var id: String
    var workoutId: String
    var workoutName: String
    var date: Date
    var durationSeconds: Int
    var totalVolume: Double
    var completedSets: [WatchCompletedSet]
}

struct WatchCompletedSet: Codable {
    var exerciseId: String
    var exerciseName: String
    var setIndex: Int
    var weight: Double
    var reps: Int
}

// MARK: - Store
class WorkoutSessionStore: NSObject, ObservableObject, WCSessionDelegate {
    @Published var workouts: [WatchWorkout] = []
    @Published var activeWorkout: WatchWorkout?
    @Published var activeExerciseIndex: Int = 0
    @Published var startTime: Date?
    @Published var durationSeconds: Int = 0
    @Published var showRestTimer: Bool = false
    @Published var restTimeRemaining: Int = 0
    @Published var activeRestTime: Int = 90
    
    private var timer: AnyCancellable?
    private var restTimer: AnyCancellable?
    private var wcSession: WCSession?
    
    var isActive: Bool {
        activeWorkout != nil
    }
    
    override init() {
        super.init()
        loadMockData()
        setupWatchConnectivity()
    }
    
    private func loadMockData() {
        // Fallback workouts when not synced yet
        self.workouts = [
            WatchWorkout(id: "1", name: "Treino A - Peito & Tríceps", exercises: [
                WatchExercise(id: "e1", name: "Supino Reto", sets: [
                    WatchWorkoutSet(weight: 60.0, reps: 10, isCompleted: false),
                    WatchWorkoutSet(weight: 60.0, reps: 10, isCompleted: false),
                    WatchWorkoutSet(weight: 60.0, reps: 8, isCompleted: false)
                ], restTime: 90, muscleGroup: "peito"),
                WatchExercise(id: "e2", name: "Tríceps Pulley", sets: [
                    WatchWorkoutSet(weight: 25.0, reps: 12, isCompleted: false),
                    WatchWorkoutSet(weight: 25.0, reps: 10, isCompleted: false)
                ], restTime: 60, muscleGroup: "tríceps")
            ]),
            WatchWorkout(id: "2", name: "Treino B - Costas & Bíceps", exercises: [
                WatchExercise(id: "e3", name: "Puxada Alta", sets: [
                    WatchWorkoutSet(weight: 50.0, reps: 10, isCompleted: false),
                    WatchWorkoutSet(weight: 50.0, reps: 10, isCompleted: false)
                ], restTime: 90, muscleGroup: "costas"),
                WatchExercise(id: "e4", name: "Rosca Direta", sets: [
                    WatchWorkoutSet(weight: 12.0, reps: 12, isCompleted: false),
                    WatchWorkoutSet(weight: 12.0, reps: 10, isCompleted: false)
                ], restTime: 60, muscleGroup: "bíceps")
            ])
        ]
    }
    
    // MARK: - WatchConnectivity Setup
    private func setupWatchConnectivity() {
        if WCSession.isSupported() {
            wcSession = WCSession.default
            wcSession?.delegate = self
            wcSession?.activate()
        }
    }
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("WCSession activation failed: \(error.localizedDescription)")
        } else {
            print("WCSession activated successfully")
            requestDataFromPhone()
        }
    }
    
    // Receive live updates or session start from iPhone
    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        DispatchQueue.main.async {
            if let workoutsData = message["workouts"] as? Data {
                if let decoded = try? JSONDecoder().decode([WatchWorkout].self, from: workoutsData) {
                    self.workouts = decoded
                }
            }
            if let activeWorkoutData = message["activeWorkout"] as? Data {
                if let decoded = try? JSONDecoder().decode(WatchWorkout.self, from: activeWorkoutData) {
                    self.activeWorkout = decoded
                    self.startTime = message["startTime"] as? Date ?? Date()
                    self.activeExerciseIndex = message["activeExerciseIndex"] as? Int ?? 0
                    self.startTimer()
                }
            }
            if let syncSetUpdate = message["syncSetUpdate"] as? [String: Any] {
                // iPhone synced a set completion
                let exerciseId = syncSetUpdate["exerciseId"] as? String
                let setIndex = syncSetUpdate["setIndex"] as? Int
                let isCompleted = syncSetUpdate["isCompleted"] as? Bool ?? false
                self.syncSetLocal(exerciseId: exerciseId, setIndex: setIndex, isCompleted: isCompleted)
            }
            if let cancelWorkout = message["cancelWorkout"] as? Bool, cancelWorkout {
                self.resetSession()
            }
        }
    }
    
    // MARK: - Actions
    func startWorkout(_ workout: WatchWorkout) {
        self.activeWorkout = workout
        self.activeExerciseIndex = 0
        self.startTime = Date()
        self.durationSeconds = 0
        self.startTimer()
        
        // Notify iPhone that workout started on Watch
        sendToPhone(message: [
            "action": "startWorkout",
            "workoutId": workout.id,
            "startTime": Date()
        ])
    }
    
    func completeSet(exerciseId: String, setIndex: Int) {
        guard var workout = activeWorkout else { return }
        
        if let exIndex = workout.exercises.firstIndex(where: { $0.id == exerciseId }) {
            if setIndex < workout.exercises[exIndex].sets.count {
                workout.exercises[exIndex].sets[setIndex].isCompleted = true
                self.activeWorkout = workout
                
                // Start Rest Timer
                let restSeconds = workout.exercises[exIndex].restTime
                startRestTimer(seconds: restSeconds)
                
                // Sync with iPhone
                sendToPhone(message: [
                    "action": "completeSet",
                    "exerciseId": exerciseId,
                    "setIndex": setIndex,
                    "weight": workout.exercises[exIndex].sets[setIndex].weight,
                    "reps": workout.exercises[exIndex].sets[setIndex].reps
                ])
            }
        }
    }
    
    func updateSetField(exerciseId: String, setIndex: Int, weight: Double, reps: Int) {
        guard var workout = activeWorkout else { return }
        
        if let exIndex = workout.exercises.firstIndex(where: { $0.id == exerciseId }) {
            if setIndex < workout.exercises[exIndex].sets.count {
                workout.exercises[exIndex].sets[setIndex].weight = weight
                workout.exercises[exIndex].sets[setIndex].reps = reps
                self.activeWorkout = workout
                
                // Sync with iPhone
                sendToPhone(message: [
                    "action": "updateSet",
                    "exerciseId": exerciseId,
                    "setIndex": setIndex,
                    "weight": weight,
                    "reps": reps
                ])
            }
        }
    }
    
    func finishWorkout() {
        guard let workout = activeWorkout else { return }
        
        var completedSets: [WatchCompletedSet] = []
        var totalVolume: Double = 0
        
        for exercise in workout.exercises {
            for (index, set) in exercise.sets.enumerated() {
                if set.isCompleted {
                    totalVolume += set.weight * Double(set.reps)
                    completedSets.append(WatchCompletedSet(
                        exerciseId: exercise.id,
                        exerciseName: exercise.name,
                        setIndex: index,
                        weight: set.weight,
                        reps: set.reps
                    ))
                }
            }
        }
        
        let session = WatchWorkoutSession(
            id: UUID().uuidString,
            workoutId: workout.id,
            workoutName: workout.name,
            date: Date(),
            durationSeconds: durationSeconds,
            totalVolume: totalVolume,
            completedSets: completedSets
        )
        
        // Notify iPhone that workout is finished
        if let sessionData = try? JSONEncoder().encode(session) {
            sendToPhone(message: [
                "action": "finishWorkout",
                "session": sessionData
            ])
        }
        
        resetSession()
    }
    
    func cancelWorkout() {
        sendToPhone(message: ["action": "cancelWorkout"])
        resetSession()
    }
    
    private func resetSession() {
        timer?.cancel()
        restTimer?.cancel()
        activeWorkout = nil
        startTime = nil
        durationSeconds = 0
        showRestTimer = false
    }
    
    // MARK: - Private Helpers
    private func startTimer() {
        timer = Timer.publish(every: 1.0, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                guard let self = self, let start = self.startTime else { return }
                self.durationSeconds = Int(Date().timeIntervalSince(start))
            }
    }
    
    private func startRestTimer(seconds: Int) {
        restTimer?.cancel()
        self.activeRestTime = seconds
        self.restTimeRemaining = seconds
        self.showRestTimer = true
        
        restTimer = Timer.publish(every: 1.0, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                guard let self = self else { return }
                if self.restTimeRemaining > 1 {
                    self.restTimeRemaining -= 1
                } else {
                    self.restTimer?.cancel()
                    self.showRestTimer = false
                    // Triggers haptic vibration
                    #if os(watchOS)
                    WKInterfaceDevice.current().play(.success)
                    #endif
                }
            }
    }
    
    private func syncSetLocal(exerciseId: String?, setIndex: Int?, isCompleted: Bool) {
        guard let exerciseId = exerciseId, let setIndex = setIndex, var workout = activeWorkout else { return }
        if let exIndex = workout.exercises.firstIndex(where: { $0.id == exerciseId }) {
            if setIndex < workout.exercises[exIndex].sets.count {
                workout.exercises[exIndex].sets[setIndex].isCompleted = isCompleted
                self.activeWorkout = workout
            }
        }
    }
    
    private func requestDataFromPhone() {
        sendToPhone(message: ["action": "requestSync"])
    }
    
    private func sendToPhone(message: [String: Any]) {
        guard let session = wcSession, session.isReachable else { return }
        session.sendMessage(message, replyHandler: nil, errorHandler: { error in
            print("Error sending message to iPhone: \(error.localizedDescription)")
        })
    }
}

// MARK: - Color Extension Theme
extension Color {
    static let themePrimary = Color(red: 225/255, green: 255/255, blue: 0) // #e1ff00
    static let themeBackground = Color.black // #000000
    static let themeSurface = Color(red: 18/255, green: 18/255, blue: 18/255) // #121212
    static let themeSurfaceVariant = Color(red: 28/255, green: 28/255, blue: 30/255) // #1c1c1e
    static let themeOnSurfaceVariant = Color(red: 161/255, green: 161/255, blue: 170/255) // #a1a1aa
}
