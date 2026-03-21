import { useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { RecommendPage } from "./pages/RecommendPage";
import { BooksPage } from "./pages/BooksPage";

const DEFAULT_DOCUMENT_TITLE =
  "LINK+ / SCCL / SMCL 中文图书豆瓣评分排行";

function DocumentTitleSync() {
  const location = useLocation();
  useEffect(() => {
    document.title =
      location.pathname === "/recommend"
        ? `推荐 · ${DEFAULT_DOCUMENT_TITLE}`
        : DEFAULT_DOCUMENT_TITLE;
  }, [location.pathname]);
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <DocumentTitleSync />
      <Navbar />
      <Routes>
        <Route path="/" element={<BooksPage />} />
        <Route path="/recommend" element={<RecommendPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
