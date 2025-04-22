// components/dashboard/
import { SessionCard } from "./SessionCard";

export function PastSessions({ sessions }) {
  const pastSessions = sessions.filter(
    (session) =>
      new Date(session.start_time) <= new Date() ||
      session.status === "cancelled"
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Past Sessions</h2>

      {pastSessions.length === 0 ? (
        <p className="text-gray-500">You have no past sessions.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pastSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onStatusChange={() => {}} // No status changes for past sessions
            />
          ))}
        </div>
      )}
    </div>
  );
}
