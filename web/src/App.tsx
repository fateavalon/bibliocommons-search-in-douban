import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { RecommendPage } from "./pages/RecommendPage";
import { BooksPage } from "./pages/BooksPage";

export default function App() {
  return (
    <HashRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<BooksPage />} />
        <Route path="/recommend" element={<RecommendPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
