"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState("Verifying...");
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      try {
        const response = await fetch(`/api/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("Email verified successfully!");
        } else {
          setStatus(data.message || "Verification failed");
        }
      } catch (error) {
        setStatus("Network error. Please try again.");
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className=" p-8 rounded shadow-md text-center">
        <h1 className="text-2xl mb-4">Email Verification</h1>
        <p>{status}</p>
        <br />
        <Button>
          <Link href={"/login"}>Login</Link>
        </Button>
      </div>
    </div>
  );
}
