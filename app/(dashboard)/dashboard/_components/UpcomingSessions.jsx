// components/dashboard/
import { SessionCard } from "./SessionCard";

export function UpcomingSessions({ sessions, onSessionStatusChange }) {
  const upcomingSessions = sessions.filter(
    (session) =>
      new Date(session.start_time) > new Date() &&
      session.status !== "cancelled"
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Upcoming Sessions</h2>

      {upcomingSessions.length === 0 ? (
        <p className="text-gray-500">You have no upcoming sessions.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onStatusChange={onSessionStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
