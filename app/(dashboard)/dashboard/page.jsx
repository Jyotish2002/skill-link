"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpcomingSessions } from "./_components/UpcomingSessions";
import { PastSessions } from "./_components/PastSessions";

export default function DashboardPage() {
  const [userSessions, setUserSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      try {
        const response = await fetch("/api/sessions");

        if (!response.ok) {
          throw new Error("Failed to fetch sessions");
        }

        const data = await response.json();
        setUserSessions(data);
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, []);

  const handleSessionStatusChange = (updatedSession) => {
    setUserSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === updatedSession.id
          ? { ...session, status: updatedSession.status }
          : session
      )
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
          <TabsTrigger value="past">Past Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <UpcomingSessions
            sessions={userSessions}
            onSessionStatusChange={handleSessionStatusChange}
          />
        </TabsContent>

        <TabsContent value="past">
          <PastSessions sessions={userSessions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
