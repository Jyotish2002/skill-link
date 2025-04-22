import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarIcon } from "lucide-react";
import Link from "next/link";

export function MentorCard({ mentor }) {
  const initials = mentor.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{mentor.name}</h3>
            <div className="flex items-center text-yellow-500">
              <StarIcon className="h-4 w-4 fill-current" />
              <span className="ml-1 text-sm">{mentor.average_rating}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {mentor.bio || "No bio available"}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {mentor.skills.slice(0, 4).map((skill, index) => (
            <Badge key={index} variant="secondary">
              {skill}
            </Badge>
          ))}
          {mentor.skills.length > 4 && (
            <Badge variant="outline">+{mentor.skills.length - 4}</Badge>
          )}
        </div>
        <Link
          href={`/mentors/${mentor.id}`}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          View Profile & Book Session
        </Link>
      </CardContent>
    </Card>
  );
}
