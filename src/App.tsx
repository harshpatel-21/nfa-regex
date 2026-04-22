import { AppProvider } from "./state/AppContext";
import { NotificationProvider } from "./components/layout/NotificationArea";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { GraphCanvas } from "./components/graph/GraphCanvas";

/** Root component composing the providers, header, sidebar, and graph canvas. */
function App() {
  return (
    <AppProvider>
      <NotificationProvider>
        <div className="h-screen flex flex-col">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 relative">
              <GraphCanvas />
            </main>
          </div>
        </div>
      </NotificationProvider>
    </AppProvider>
  );
}

export default App;
