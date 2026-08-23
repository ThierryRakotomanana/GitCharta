import { createBrowserRouter, Navigate } from "react-router-dom";
import { LandingPage } from "./routes/LandingPage";
import { AppShell } from "./routes/AppShell";
import { MapPage } from "./routes/MapPage";
import { AnalyticsPage } from "./routes/AnalyticsPage";
import { AutomatePage } from "./routes/AutomatePage";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <LandingPage />
	},
	{
		path: "/app",
		element: <AppShell />,
		children: [
			{ index: true, element: <Navigate to='map' replace /> },
			{ path: "map", element: <MapPage /> },
			{ path: "analytics", element: <AnalyticsPage /> },
			{ path: "automate", element: <AutomatePage /> }
		]
	},
	{
		path: "*",
		element: <Navigate to='/' replace />
	}
]);
