import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { AddCustomerPage, EditCustomerPage } from "./pages/CustomerFormPage";
import { AssistantPage } from "./pages/AssistantPage";
import { BusinessInsightsPage } from "./pages/BusinessInsightsPage";
import { CustomerDetailsPage } from "./pages/CustomerDetailsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LedgerPage } from "./pages/LedgerPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TransactionsPage } from "./pages/TransactionsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/new" element={<AddCustomerPage />} />
          <Route path="customers/:id" element={<CustomerDetailsPage />} />
          <Route path="customers/:id/edit" element={<EditCustomerPage />} />
          <Route path="ledger" element={<LedgerPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="insights" element={<BusinessInsightsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
