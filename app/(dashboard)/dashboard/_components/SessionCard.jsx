import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video } from "lucide-react";
import { format, isPast } from "date-fns";
import Link from "next/link";
import toast from "react-hot-toast";

export function SessionCard({ session, onStatusChange }) {
  const [updating, setUpdating] = useState(false);

  const isMentor =
    session.mentor_id === parseInt(localStorage.getItem("userId"));
  const isPending = session.status === "pending";
  const isCompleted = session.status === "completed";
  const isCancelled = session.status === "cancelled";
  const isConfirmed = session.status === "confirmed";
  const sessionInPast = isPast(new Date(session.start_time));

  const getStatusColor = () => {
    switch (session.status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100";
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);

    try {
      const response = await fetch("/api/sessions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: session.id,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${newStatus} session`);
      }

      const updatedSession = await response.json();
      onStatusChange(updatedSession);

      toast.success(
        `Session ${
          newStatus === "confirmed" ? "confirmed" : "cancelled"
        } successfully.`
      );
    } catch (err) {
      console.error(`Error ${newStatus} session:`, err);
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="pt-6 flex-grow">
        <div className="mb-4">
          <Badge className={getStatusColor()}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </Badge>
        </div>

        <h3 className="text-lg font-medium mb-2">
          Session with {isMentor ? session.learner_name : session.mentor_name}
        </h3>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>{format(new Date(session.start_time), "MMMM d, yyyy")}</span>
          </div>

          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              {format(new Date(session.start_time), "h:mm a")} -{" "}
              {format(new Date(session.end_time), "h:mm a")}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 pb-4 flex flex-wrap gap-2">
        {/* Join Call Button - only show for confirmed future sessions */}
        {isConfirmed && !sessionInPast && (
          <Link href={`/call/${session.id}`} className="flex-grow">
            <Button className="w-full" variant="outline">
              <Video className="h-4 w-4 mr-2" />
              Join Call
            </Button>
          </Link>
        )}

        {/* Mentor Actions - only show for pending sessions */}
        {isMentor && isPending && !sessionInPast && (
          <>
            <Button
              variant="default"
              className="flex-grow"
              onClick={() => handleStatusChange("confirmed")}
              disabled={updating}
            >
              Confirm
            </Button>
            <Button
              variant="outline"
              className="flex-grow text-red-600 hover:text-red-700"
              onClick={() => handleStatusChange("cancelled")}
              disabled={updating}
            >
              Decline
            </Button>
          </>
        )}

        {/* Learner Actions - cancel pending or confirmed sessions */}
        {!isMentor && (isPending || isConfirmed) && !sessionInPast && (
          <Button
            variant="outline"
            className="flex-grow text-red-600 hover:text-red-700"
            onClick={() => handleStatusChange("cancelled")}
            disabled={updating}
          >
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
