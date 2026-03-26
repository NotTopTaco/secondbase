import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameSelectionScreen } from './features/gameSelection/GameSelectionScreen';
import { CompanionView } from './features/companionView/CompanionView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameSelectionScreen />} />
        <Route path="/game/:gamePk" element={<CompanionView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
