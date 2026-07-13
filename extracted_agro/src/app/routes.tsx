import { createBrowserRouter } from "react-router";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Alerts } from "./pages/Alerts";
import { FarmData } from "./pages/FarmData";
import { Settings } from "./pages/Settings";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/landing",
    element: <Landing />,
  },
  {
    path: "/app",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "alerts",
        element: <Alerts />,
      },
      {
        path: "farm-data",
        element: <FarmData />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
]);
