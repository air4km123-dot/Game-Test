import { useState } from "react";
import { GamesProvider, useGames } from "./context/GamesContext";
import { Home } from "./components/Home";
import { GameShell } from "./components/GameShell";
import { BottomNavigation, type GameTab } from "./components/BottomNavigation";

type View = { screen: "home" } | { screen: "game"; gameId: string; tab: GameTab };

function AppShell() {
  const { activeGames, finishedGames } = useGames();
  const [view, setView] = useState<View>({ screen: "home" });

  const openGame = (gameId: string, tab: GameTab = "play") =>
    setView({ screen: "game", gameId, tab });

  // Best guess for "the current game" when the bottom nav is tapped from Home.
  const fallbackGame = activeGames[0] ?? finishedGames[0] ?? null;

  const handleNavChange = (tab: GameTab) => {
    if (view.screen === "game") {
      setView({ screen: "game", gameId: view.gameId, tab });
      return;
    }
    if (fallbackGame) {
      setView({ screen: "game", gameId: fallbackGame.id, tab });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {view.screen === "home" ? (
          <Home onOpenGame={openGame} />
        ) : (
          <GameShell
            gameId={view.gameId}
            tab={view.tab}
            onBack={() => setView({ screen: "home" })}
          />
        )}
      </div>
      <BottomNavigation active={view.screen === "game" ? view.tab : null} onChange={handleNavChange} />
    </div>
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
