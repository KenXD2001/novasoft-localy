import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { MainLayout } from "./components/layout";
import { DetailsTab, LogsTab, Overview, ServicesTab, TunnelsTab } from "./components/projects";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Services from "./pages/Services";
import Tunnels from "./pages/Tunnels";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/services" element={<Services />} />
          <Route path="/tunnels" element={<Tunnels />} />
          <Route path="/projects/overview" element={<Overview />}>
            <Route index element={<Navigate to="details" replace />} />
            <Route path="details" element={<DetailsTab />} />
            <Route path="services" element={<ServicesTab />} />
            <Route path="tunnels" element={<TunnelsTab />} />
            <Route path="logs" element={<LogsTab />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
