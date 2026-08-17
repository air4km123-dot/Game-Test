import { useState } from "react";
import { GamesProvider } from "./context/GamesContext";
import { Home } from "./components/Home";
import { GameShell } from "./components/GameShell";
import type { GameTab } from "./components/BottomNavigation";

type View = { screen: "home" } | { screen: "game"; gameId: string; tab: GameTab };

function AppShell() {
  const [view, setView] = useState<View>({ screen: "home" });

  if (view.screen === "home") {
    return <Home onOpenGame={(gameId) => setView({ screen: "game", gameId, tab: "play" })} />;
  }

  return (
    <GameShell
      gameId={view.gameId}
      tab={view.tab}
      onChangeTab={(tab) => setView({ screen: "game", gameId: view.gameId, tab })}
      onBack={() => setView({ screen: "home" })}
    />
  );
}

function App() {
  return (
    <GamesProvider>
      <AppShell />
    </GamesProvider>
  );
}

export default App;
