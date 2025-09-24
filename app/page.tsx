"use client";

// Landing page
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();

  return (
    <>
      <Authenticated>
        <UserButton />
        <h1>
          Welcome {user?.firstName}, user number: {}
        </h1>
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
    </>
  );
}
