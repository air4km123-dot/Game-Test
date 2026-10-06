import { useState } from "react";
import { GamesProvider, useGames } from "./context/GamesContext";
import { SyncProvider } from "./context/SyncContext";
import { Home } from "./components/Home";
import { GameShell } from "./components/GameShell";
import { Dashboard } from "./components/Dashboard";
import { BottomNavigation, type GameTab, type NavTab } from "./components/BottomNavigation";

type View =
  | { screen: "home" }
  | { screen: "dashboard" }
  | { screen: "game"; gameId: string; tab: GameTab };

function AppShell() {
  const { activeGames, finishedGames } = useGames();
  const [view, setView] = useState<View>({ screen: "home" });
  // remembers the game being looked at so a tab tap from the dashboard returns to it
  const [lastGameId, setLastGameId] = useState<string | null>(null);

  const openGame = (gameId: string, tab: GameTab = "play") => {
    setLastGameId(gameId);
    setView({ screen: "game", gameId, tab });
  };

  // Best guess for "the current game" when a game tab is tapped from Home / dashboard.
  const fallbackGame =
    [...activeGames, ...finishedGames].find((g) => g.id === lastGameId) ??
    activeGames[0] ??
    finishedGames[0] ??
    null;

  const handleNavChange = (tab: NavTab) => {
    if (tab === "dashboard") {
      setView({ screen: "dashboard" });
      return;
    }
    if (view.screen === "game") {
      setView({ screen: "game", gameId: view.gameId, tab });
      return;
    }
    if (fallbackGame) {
      openGame(fallbackGame.id, tab);
    }
  };

  const activeTab: NavTab | null =
    view.screen === "game" ? view.tab : view.screen === "dashboard" ? "dashboard" : null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {view.screen === "home" && <Home onOpenGame={openGame} />}
        {view.screen === "dashboard" && <Dashboard onBack={() => setView({ screen: "home" })} />}
        {view.screen === "game" && (
          <GameShell
            gameId={view.gameId}
            tab={view.tab}
            onBack={() => setView({ screen: "home" })}
          />
        )}
      </div>
      <BottomNavigation active={activeTab} onChange={handleNavChange} />
    </div>
  );
}

function App() {
  return (
    <GamesProvider>
      <SyncProvider>
        <AppShell />
      </SyncProvider>
    </GamesProvider>
  );
}

export default App;
