import React from "react";
import "./App.css";
import { RoutePlayer } from "./RoutePlayer";
import { HiroshimaMiyoshi } from "./data/hiroshima-miyoshi";

function App() {
  return (
    <div className="main-container">
      <RoutePlayer route={HiroshimaMiyoshi} />
    </div>
  );
}

export default App;
