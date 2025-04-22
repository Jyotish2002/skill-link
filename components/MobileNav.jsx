// components/ui/mobile-nav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X } from "lucide-react";
import { SheetClose } from "@/components/ui/sheet";

export default function MobileNav({ items, user, onSignOut }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="text-lg font-semibold">Menu</div>
        <SheetClose className="rounded-full p-2 hover:bg-gray-800">
          <X className="h-5 w-5" />
        </SheetClose>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-6">
          {/* User profile section */}
          {user && (
            <div className="px-4 pb-4 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage
                    src={user.avatar_url || ""}
                    alt={user.name || "User"}
                  />
                  <AvatarFallback className="bg-gradient-to-r from-[#ff4da6] to-[#7f00ff]">
                    {user.name?.substring(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name || "User"}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <Link
                  href="/profile"
                  className="block px-2 py-2 text-sm rounded-md hover:bg-gray-800"
                >
                  Profile
                </Link>
                <Link
                  href="/plan"
                  className="block px-2 py-2 text-sm rounded-md hover:bg-gray-800"
                >
                  My Plan
                </Link>
              </div>
            </div>
          )}

          {/* Navigation links */}
          <div className="px-4">
            <ul className="space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-3 text-base rounded-md transition-colors ${
                        isActive
                          ? "bg-gradient-to-r from-[#ff4da6]/20 to-[#7f00ff]/20 text-white font-medium"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      {item.name}
                      {isActive && (
                        <div className="ml-2 w-1 h-5 bg-gradient-to-b from-[#ff4da6] to-[#7f00ff] rounded-full" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>

      {/* Auth buttons */}
      <div className="p-4 border-t border-gray-800">
        {user ? (
          <Button
            variant="destructive"
            className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:opacity-90"
            onClick={onSignOut}
          >
            Log Out
          </Button>
        ) : (
          <div className="space-y-2">
            <Button className="w-full bg-gradient-to-r from-[#ff4da6] to-[#7f00ff] hover:opacity-90">
              Sign Up
            </Button>
            <Button
              variant="outline"
              className="w-full text-white border-gray-700 hover:bg-gray-800 hover:border-gray-600"
            >
              Log In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
