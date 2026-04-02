import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./components/RequireAuth";
import { LoginPage } from "./pages/LoginPage";
import { CampaignListPage } from "./pages/CampaignListPage";
import { CampaignNewPage } from "./pages/CampaignNewPage";
import { CampaignDetailPage } from "./pages/CampaignDetailPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/campaigns" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/campaigns"
        element={
          <RequireAuth>
            <CampaignListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/campaigns/new"
        element={
          <RequireAuth>
            <CampaignNewPage />
          </RequireAuth>
        }
      />
      <Route
        path="/campaigns/:id"
        element={
          <RequireAuth>
            <CampaignDetailPage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/campaigns" replace />} />
    </Routes>
  );
}

export default App;
