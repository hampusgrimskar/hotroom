import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { socket } from "../lib/socket";

interface Player {
  id: string;
  nickname: string;
  color: string;
  connected: number;
}

export function WaitingRoom() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    socket.on("players:updated", (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    });

    socket.on("game:started", () => {
      // TODO: navigate to game screen
    });

    return () => {
      socket.off("players:updated");
      socket.off("game:started");
    };
  }, []);

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
