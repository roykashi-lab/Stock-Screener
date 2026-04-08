import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import ScreenerPage from "./pages/ScreenerPage";
import StockDetailPage from "./pages/StockDetailPage";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<ScreenerPage />} />
          <Route path="/stock/:ticker" element={<StockDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
