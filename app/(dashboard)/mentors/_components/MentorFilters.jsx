import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function MentorFilters({ onFilter }) {
  const [skill, setSkill] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter({ skill });
  };

  const handleClear = () => {
    setSkill("");
    onFilter({ skill: "" });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 mb-6"
    >
      <div className="relative flex-grow">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by skill (e.g. JavaScript, Marketing)"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className="pl-8"
        />
        {skill && (
          <button
            type="button"
            onClick={() => setSkill("")}
            className="absolute right-2 top-2.5"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>
      <Button type="submit">Search</Button>
      {skill && (
        <Button variant="outline" type="button" onClick={handleClear}>
          Clear
        </Button>
      )}
    </form>
  );
}
