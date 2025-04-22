"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import MobileNav from "./MobileNav";

export default function Navbar({ user }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Bedroom Game", href: "/bedroom-game" },
    { name: "Audio Library", href: "/audio" },
    { name: "Favorites", href: "/favorites" },
    { name: "Journal", href: "/journal" },
  ];

  const isActive = (path) => pathname === path;

  // Mock sign out function - replace with your actual sign out logic
  const handleSignOut = () => {
    console.log("User signed out");
    // In a real app, you would call your auth provider's sign out method
    // and update the user state
  };

  return (
    <>
      {/* Add a spacer div with the same height as the navbar to prevent content collision */}
      <div className="h-16"></div>

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "shadow-lg" : ""
        }`}
        style={{
          background: isScrolled
            ? "linear-gradient(to right, rgba(26, 26, 26, 0.95), rgba(26, 26, 26, 0.95)), linear-gradient(to right, #121212, #2d1f3f)"
            : "linear-gradient(to right, #121212, #1a0f2e, #2d1f3f)",
          backdropFilter: isScrolled ? "blur(8px)" : "none",
        }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#ff4da6] to-[#7f00ff] flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="text-white font-semibold text-xl">IntimiMate</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                {navItems.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <Link href={item.href} legacyBehavior passHref>
                      <NavigationMenuLink
                        className={`px-4 py-2 text-sm text-gray-200 hover:text-white transition-all relative group ${
                          isActive(item.href)
                            ? "text-white font-medium after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-[#ff4da6] after:to-[#7f00ff]"
                            : ""
                        }`}
                      >
                        {item.name}
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#ff4da6]/10 to-[#7f00ff]/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></span>
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Auth section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer border border-gray-700 hover:border-[#ff4da6] transition-all">
                    <AvatarImage
                      src={user.avatar_url || ""}
                      alt={user.name || "User"}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-[#ff4da6] to-[#7f00ff] text-white">
                      {user.name?.substring(0, 2) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-[#222] border-gray-800 text-white"
                >
                  <div className="px-2 py-2 text-sm font-medium">
                    <p>{user.name || "User"}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer">
                    <Link href="/profile" className="flex w-full">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer">
                    <Link href="/plan" className="flex w-full">
                      My Plan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-400 hover:text-red-300 hover:bg-gray-800 cursor-pointer"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-gray-800"
                >
                  Login
                </Button>
                <Button className="bg-gradient-to-r from-[#ff4da6] to-[#7f00ff] hover:opacity-90 text-white border-none">
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white"
                    aria-label="Menu"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="bg-[#1a1a1a] border-gray-800 text-white p-0"
                >
                  <MobileNav
                    items={navItems}
                    user={user}
                    onSignOut={handleSignOut}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
