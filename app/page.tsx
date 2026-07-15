import { Suspense } from "react";
import FocusPlayer from "@/components/FocusPlayer";

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-canvas" />}>
      <FocusPlayer />
    </Suspense>
  );
}
