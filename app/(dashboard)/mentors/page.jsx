"use client";

import { useState, useEffect } from "react";
import { MentorFilters } from "./_components/MentorFilters";
import { MentorList } from "./_components/MentorList";
import { useSearchParams, useRouter } from "next/navigation";

export default function MentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPage = parseInt(searchParams.get("page") || "1");
  const currentSkill = searchParams.get("skill") || "";

  useEffect(() => {
    async function fetchMentors() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", currentPage.toString());
        params.set("limit", pagination.limit.toString());

        if (currentSkill) {
          params.set("skill", currentSkill);
        }

        const response = await fetch(`/api/mentors?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch mentors");
        }

        const data = await response.json();
        setMentors(data.mentors);
        setPagination(data.pagination);
      } catch (err) {
        console.error("Error fetching mentors:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMentors();
  }, [currentPage, currentSkill, pagination.limit]);

  const handleFilter = (filters) => {
    const params = new URLSearchParams();
    params.set("page", "1");

    if (filters.skill) {
      params.set("skill", filters.skill);
    }

    router.push(`/mentors?${params.toString()}`);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`/mentors?${params.toString()}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Find a Mentor</h1>

      <MentorFilters onFilter={handleFilter} />

      {loading ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">Loading mentors...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-red-500">Error: {error}</p>
        </div>
      ) : (
        <MentorList
          mentors={mentors}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
