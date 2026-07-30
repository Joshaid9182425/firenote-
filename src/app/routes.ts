import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { Canvas } from "./pages/Canvas";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Dashboard,
  },
  {
    path: "/board/:id",
    Component: Canvas,
  },
]);
