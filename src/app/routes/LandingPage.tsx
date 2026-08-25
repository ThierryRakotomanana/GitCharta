import { useNavigate } from "react-router-dom";
import LandingPageContent from "@/shared/components/LandingPage";

export function LandingPage() {
	const navigate = useNavigate();
	return <LandingPageContent onSubmit={() => navigate("/app/map")} />;
}
