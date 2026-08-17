import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useSocket } from "../lib/socket-context";
import { SocketEvents } from "@hotseat/shared";
import type { Player } from "@hotseat/shared";

export function WaitingRoom() {
  const socket = useSocket();
  const location = useLocation();
  const initialPlayers = (location.state as { players?: Player[] })?.players || [];
  const [players, setPlayers] = useState<Player[]>(initialPlayers);

  useEffect(() => {
    socket.on(SocketEvents.PLAYERS_UPDATED, (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    });

    socket.on(SocketEvents.GAME_STARTED, () => {
      // TODO: navigate to game screen
    });

    return () => {
      socket.off(SocketEvents.PLAYERS_UPDATED);
      socket.off(SocketEvents.GAME_STARTED);
    };
  }, [socket]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 p-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <h2 className="mb-2 text-3xl font-bold">You're in! 🔥</h2>
        <p className="mb-8 text-white/80">Waiting for the host to start the game...</p>

        <div className="rounded-xl bg-white/10 p-6">
          <h3 className="mb-4 text-lg font-semibold">Players ({players.length})</h3>
          {players.length === 0 ? (
            <p className="text-white/60">Loading players...</p>
          ) : (
            <ul className="space-y-2">
              {players.map((player) => (
                <li
                  key={player.id}
                  className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="font-medium">{player.nickname}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
