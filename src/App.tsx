import { SandboxScreen } from "./modes/sandbox/SandboxScreen";
import { ScreenSizeGate } from "./ScreenSizeGate";

function App() {
  return (
    <ScreenSizeGate>
      <div className="app-root">
        <SandboxScreen />
      </div>
    </ScreenSizeGate>
  );
}

export default App;
