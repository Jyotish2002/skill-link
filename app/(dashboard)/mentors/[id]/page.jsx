// app/mentors/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format, addDays, parseISO, isBefore, isAfter } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarIcon, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function MentorProfilePage() {
  const { id } = useParams();
  const [mentor, setMentor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [bookedSessions, setBookedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Fetch mentor profile
  useEffect(() => {
    async function fetchMentorProfile() {
      setLoading(true);
      try {
        // Fetch mentor details
        const mentorResponse = await fetch(`/api/mentors?id=${id}`);
        if (!mentorResponse.ok) {
          throw new Error("Failed to fetch mentor profile");
        }
        const mentorData = await mentorResponse.json();
        setMentor(mentorData.mentors[0]);

        // Fetch availability
        const availabilityResponse = await fetch(
          `/api/availability?mentorId=${id}`
        );
        if (!availabilityResponse.ok) {
          throw new Error("Failed to fetch availability");
        }
        const availabilityData = await availabilityResponse.json();
        setAvailability(availabilityData.availability);
        setBookedSessions(availabilityData.bookedSessions);
      } catch (err) {
        console.error("Error fetching mentor profile:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMentorProfile();
  }, [id]);

  // Get available time slots for the selected date
  const getAvailableSlots = () => {
    if (!availability.length) return [];

    const dayOfWeek = selectedDate.getDay();
    const slotsForDay = availability.filter(
      (slot) => slot.day_of_week === dayOfWeek
    );

    // Generate 30-minute slots within each availability window
    const availableSlots = [];

    slotsForDay.forEach((slot) => {
      const startHour = parseInt(slot.start_time.split(":")[0]);
      const startMinute = parseInt(slot.start_time.split(":")[1]);
      const endHour = parseInt(slot.end_time.split(":")[0]);
      const endMinute = parseInt(slot.end_time.split(":")[1]);

      const startDate = new Date(selectedDate);
      startDate.setHours(startHour, startMinute, 0, 0);

      const endDate = new Date(selectedDate);
      endDate.setHours(endHour, endMinute, 0, 0);

      // Create 30-minute slots
      let currentSlot = new Date(startDate);

      while (currentSlot < endDate) {
        const slotEnd = new Date(currentSlot);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30);

        if (slotEnd <= endDate) {
          // Check if slot is already booked
          const isBooked = bookedSessions.some((session) => {
            const sessionStart = new Date(session.start_time);
            const sessionEnd = new Date(session.end_time);

            // app/mentors/[id]/page.js (continued)
            return (
              (currentSlot >= sessionStart && currentSlot < sessionEnd) ||
              (slotEnd > sessionStart && slotEnd <= sessionEnd) ||
              (currentSlot <= sessionStart && slotEnd >= sessionEnd)
            );
          });

          // Only add slots that are in the future
          const now = new Date();
          if (!isBooked && currentSlot > now) {
            availableSlots.push({
              start: new Date(currentSlot),
              end: new Date(slotEnd),
            });
          }
        }

        // Move to next slot
        currentSlot = new Date(slotEnd);
      }
    });

    return availableSlots;
  };

  const availableSlots = getAvailableSlots();

  const handleBookSession = async () => {
    if (!selectedSlot) return;

    setBookingInProgress(true);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mentor_id: id,
          start_time: selectedSlot.start.toISOString(),
          end_time: selectedSlot.end.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to book session");
      }

      toast.success(
        "Your session has been booked. The mentor will confirm it soon."
      );

      // Reset selection
      setSelectedSlot(null);

      // Refetch availability to update UI
      const availabilityResponse = await fetch(
        `/api/availability?mentorId=${id}`
      );
      const availabilityData = await availabilityResponse.json();
      setBookedSessions(availabilityData.bookedSessions);
    } catch (err) {
      console.error("Error booking session:", err);
      toast.error(err.message);
    } finally {
      setBookingInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-gray-500">Loading mentor profile...</p>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-red-500">Error: {error || "Mentor not found"}</p>
      </div>
    );
  }

  const initials = mentor.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Mentor Profile */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{mentor.name}</h1>
                <div className="flex items-center text-yellow-500 mt-1">
                  <StarIcon className="h-4 w-4 fill-current" />
                  <span className="ml-1">
                    {mentor.average_rating || "New Mentor"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                {mentor.bio || "No bio available"}
              </p>

              <h3 className="font-medium mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {mentor.skills.map((skill, index) => (
                  <Badge key={index}>{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Calendar */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Book a Session</h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">1. Select a Date</h3>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => {
                      // Disable past dates and dates with no availability
                      const dayOfWeek = date.getDay();
                      const hasAvailability = availability.some(
                        (slot) => slot.day_of_week === dayOfWeek
                      );
                      return isBefore(date, new Date()) || !hasAvailability;
                    }}
                    className="rounded border"
                  />
                </div>

                <div>
                  <h3 className="font-medium mb-2">2. Select a Time Slot</h3>

                  {availableSlots.length === 0 ? (
                    <p className="text-gray-500">
                      No available slots for this date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((slot, index) => (
                        <Button
                          key={index}
                          variant={
                            selectedSlot === slot ? "default" : "outline"
                          }
                          className="justify-start"
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {format(slot.start, "h:mm a")}
                        </Button>
                      ))}
                    </div>
                  )}

                  {selectedSlot && (
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">3. Confirm Booking</h3>
                      <div className="p-4 bg-blue-50 rounded mb-4">
                        <p>
                          <strong>Date:</strong>{" "}
                          {format(selectedSlot.start, "MMMM d, yyyy")}
                        </p>
                        <p>
                          <strong>Time:</strong>{" "}
                          {format(selectedSlot.start, "h:mm a")} -{" "}
                          {format(selectedSlot.end, "h:mm a")}
                        </p>
                        <p>
                          <strong>Duration:</strong> 30 minutes
                        </p>
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleBookSession}
                        disabled={bookingInProgress}
                      >
                        {bookingInProgress ? "Booking..." : "Book Session"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
