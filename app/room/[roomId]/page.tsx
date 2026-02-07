import { RoomArena } from "@/components/arena/room-arena";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <RoomArena roomId={roomId} />;
}
