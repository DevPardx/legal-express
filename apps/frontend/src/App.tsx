import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { I18nProvider } from "./i18n";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/router/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DocumentRequestPage } from "./pages/DocumentRequestPage";
import { SuccessPage } from "./pages/SuccessPage";
import { DocumentDashboard } from "./pages/DocumentDashboard";
import { DocumentDetail } from "./pages/DocumentDetail";
import { WebhooksPage } from "./pages/WebhooksPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { DocumentsListPage } from "./pages/DocumentsListPage";

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/documents" replace />} />
            <Route path="/request" element={<DocumentRequestPage />} />
            <Route path="/success/:jobId" element={<SuccessPage />} />
            <Route path="/documents" element={<ProtectedRoute><DocumentDashboard /></ProtectedRoute>} />
            <Route path="/documents/list" element={<ProtectedRoute><DocumentsListPage /></ProtectedRoute>} />
            <Route path="/documents/:id" element={<ProtectedRoute><DocumentDetail /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
            <Route path="/webhooks" element={<ProtectedRoute><WebhooksPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}
