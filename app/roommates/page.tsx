export const dynamic = "force-dynamic";
import { Suspense } from "react";
import ClientRoommates from "./ClientRoommates";

export default function RoommatesPage() {
  return (
    <Suspense fallback={null}>
      <ClientRoommates />
    </Suspense>
  );
}