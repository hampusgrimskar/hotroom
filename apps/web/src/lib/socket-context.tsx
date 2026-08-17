import { createContext, useContext, type ReactNode } from "react";
import type { Socket } from "socket.io-client";
import { socket as defaultSocket } from "./socket";

const SocketContext = createContext<Socket>(defaultSocket);

export function SocketProvider({ socket, children }: { socket?: Socket; children: ReactNode }) {
  return (
    <SocketContext.Provider value={socket ?? defaultSocket}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): Socket {
  return useContext(SocketContext);
}
