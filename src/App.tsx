import { AppProvider } from './state/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GraphCanvas } from './components/graph/GraphCanvas';
import { NotificationArea } from './components/layout/NotificationArea';

function App() {
  return (
    <AppProvider>
      <div className="flex flex-col h-screen bg-gray-50">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <GraphCanvas />
          </main>
        </div>
        <NotificationArea />
      </div>
    </AppProvider>
  );
}

export default App;
