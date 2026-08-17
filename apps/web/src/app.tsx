import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/landing";
import { HostLobby } from "./pages/host-lobby";
import { JoinGame } from "./pages/join-game";
import { WaitingRoom } from "./pages/waiting-room";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/host" element={<HostLobby />} />
        <Route path="/join" element={<JoinGame />} />
        <Route path="/waiting" element={<WaitingRoom />} />
      </Routes>
    </BrowserRouter>
  );
}
