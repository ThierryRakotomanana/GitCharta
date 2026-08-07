import { useReducer, useState } from "react";
import CredentialForm from "./components/CredentialForm";
import LandingPage from "@/components/LandingPage";
import { LoadingView } from "./components/LoadingView";
import { ErrorView } from "@/components/ErrorView";
import { WorldMap } from "@/components/WorldMap";
import { CountryList } from "@/components/CountryList";
import { useAudience } from "./hooks/useAudience";
import { useElementSize } from "./hooks/useElementSize";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from "@/components/ui/sheet";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
	AlertTriangle,
	ArrowRightLeft,
	BarChart3,
	List,
	Loader2,
	MapIcon,
	Workflow
} from "lucide-react";
import { GithubIcon } from "@/components/icons/lucide-github";
import type { Credentials } from "@/api/graphql.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type AudienceType = "followers" | "following" | "ghosts";

const AUDIENCE_TABS: { value: AudienceType; label: string; noun: string }[] = [
	{ value: "followers", label: "Followers", noun: "follower" },
	{ value: "following", label: "Following", noun: "followed account" },
	{ value: "ghosts", label: "Ghost Zone", noun: "ghost" }
];

export type MAP_MODE = "GLOBE" | "SPHERE";

type AppState = {
	country: string | null;
	audienceType: AudienceType;
	credentials: Credentials;
	mapMode: MAP_MODE;
};

type AppAction =
	| { type: "SET_COUNTRY"; payload: string | null }
	| { type: "SET_AUDIENCE_TYPE"; payload: AudienceType }
	| { type: "SET_CREDENTIALS"; payload: Credentials }
	| { type: "RESET_USER" }
	| { type: "SET_MODE"; payload: MAP_MODE };

const initialState: AppState = {
	country: null,
	audienceType: "followers",
	credentials: { user: "", token: "" },
	mapMode: "SPHERE"
};

function appReducer(state: AppState, action: AppAction): AppState {
	switch (action.type) {
		case "SET_COUNTRY":
			return { ...state, country: action.payload };
		case "SET_AUDIENCE_TYPE":
			return { ...state, audienceType: action.payload, country: null };
		case "SET_CREDENTIALS":
			return { ...state, credentials: action.payload };
		case "SET_MODE":
			return { ...state, mapMode: action.payload };
		case "RESET_USER":
			return initialState;
		default:
			return state;
	}
}

export default function App() {
	const [{ country, audienceType, credentials, mapMode }, dispatch] = useReducer(
		appReducer,
		initialState
	);

	const isMobile = useMediaQuery("(max-width: 767px)");
	const [sheetOpen, setSheetOpen] = useState(false);
	const [start, setStart] = useState(false);

	const { ref: mapContainerRef, size } = useElementSize<HTMLDivElement>();
	const {
		status,
		steps,
		error,
		pct,
		estimate,
		user,
		audience,
		resetAt,
		partialCount,
		proceed,
		retry
	} = useAudience(credentials);

	const currentNoun =
		AUDIENCE_TABS.find((t) => t.value === audienceType)?.noun ?? "follower";
	const currentAudience = audience?.[audienceType];

	const handleResetUser = () => dispatch({ type: "RESET_USER" });
	const setCountry = (c: string | null) => {
		dispatch({ type: "SET_COUNTRY", payload: c });
		if (c) setSheetOpen(true);
	};

	const [appView, setAppView] = useState("map");

	if (!start) return <LandingPage onSubmit={() => setStart(true)} />;
	if (!credentials.user)
		return (
			<CredentialForm
				onSubmit={(c) => dispatch({ type: "SET_CREDENTIALS", payload: c })}
			/>
		);

	return (
		<div className='h-screen w-screen overflow-hidden bg-background flex flex-col'>
			{user && (
				<header className='bg-background/95 px-2 sm:px-4 backdrop-blur-xl border-b border-border/40 shadow-sm shrink-0 relative z-50'>
					<div className='max-w-screen-2xl mx-auto px-4 h-14 grid grid-cols-2 md:grid-cols-3 items-center gap-4'>
						<div className='flex items-center gap-3 min-w-0 justify-self-start'>
							<Avatar className='h-8 w-8 ring-1 ring-border/60 shadow-sm shrink-0'>
								<AvatarImage src={user.avatarUrl} alt={user.login} />
								<AvatarFallback className='text-[10px]'>
									{user.login.slice(0, 2).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className='flex flex-col min-w-0'>
								<span className='text-sm font-semibold tracking-tight text-foreground leading-none truncate'>
									{user.name ?? user.login}
								</span>
								<a
									href={user.url}
									target='_blank'
									rel='noreferrer'
									className='text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-0.5 truncate'>
									@{user.login}
								</a>
							</div>
						</div>

						<div className='hidden md:flex justify-self-center p-1 bg-muted/30 backdrop-blur-md rounded-full border border-border/50'>
							{[
								{ id: "map", label: "Map", icon: MapIcon },
								{ id: "analytics", label: "Analytics", icon: BarChart3 },
								{ id: "automate", label: "Automate", icon: Workflow }
							].map((tab) => (
								<button
									key={tab.id}
									onClick={() => setAppView(tab.id)}
									className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 outline-none ${
										appView === tab.id ?
											"bg-background text-foreground shadow-sm ring-1 ring-border/50"
										:	"text-muted-foreground hover:text-foreground hover:bg-muted/50"
									}`}>
									<tab.icon
										className={`h-3.5 w-3.5 ${appView === tab.id ? "text-primary" : "opacity-70"}`}
									/>
									{tab.label}
								</button>
							))}
						</div>

						<div className='flex items-center gap-3 justify-self-end'>
							{!isMobile && (
								<div className='hidden lg:flex items-center gap-5 pr-4 border-r border-border/40'>
									<div className='flex items-baseline gap-1.5'>
										<span className='text-sm font-semibold tabular-nums text-foreground tracking-tight'>
											{user.followersCount.toLocaleString()}
										</span>
										<span className='text-[10px] uppercase tracking-widest text-muted-foreground font-medium'>
											Followers
										</span>
									</div>
									<div className='flex items-baseline gap-1.5'>
										<span className='text-sm font-semibold tabular-nums text-foreground tracking-tight'>
											{user.followingCount.toLocaleString()}
										</span>
										<span className='text-[10px] uppercase tracking-widest text-muted-foreground font-medium'>
											Following
										</span>
									</div>
								</div>
							)}

							<div className='flex items-center gap-1'>
								{status === "success" && currentAudience && (
									<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
										<SheetTrigger asChild>
											<Button
												variant='ghost'
												size='icon'
												className='h-8 w-8 md:hidden text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors'
												title='Open Leaderboard'>
												<List className='h-4 w-4' />
											</Button>
										</SheetTrigger>

										<SheetContent
											side='right'
											className='w-full sm:w-85 p-0 flex flex-col border-l border-border/30 bg-background/90 backdrop-blur-2xl shadow-2xl'>
											<div className='px-5 py-4 border-b border-border/30 bg-card/30'>
												<SheetHeader>
													<SheetTitle className='text-xs font-bold uppercase tracking-widest text-primary'>
														Global Distribution
													</SheetTitle>
												</SheetHeader>
											</div>
											<div className='flex-1 overflow-hidden p-5 pt-3'>
												<CountryList
													data={currentAudience}
													country={country}
													setCountry={setCountry}
													label={currentNoun}
												/>
											</div>
										</SheetContent>
									</Sheet>
								)}

								<Button
									variant='ghost'
									size='icon'
									onClick={handleResetUser}
									title='Switch Account'
									className='h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors'>
									<ArrowRightLeft className='h-4 w-4' />
								</Button>

								<a
									href='https://github.com/ThierryRakotomanana/Github-Audience-Atlas'
									target='_blank'
									rel='noreferrer'
									className='h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors'>
									<GithubIcon className='h-4 w-4' />
								</a>
							</div>
						</div>
					</div>
				</header>
			)}

			<main className='flex-1 flex flex-col min-h-0 relative overflow-hidden'>
				{status === "loading" && (
					<LoadingView steps={steps} pct={pct} onCancel={handleResetUser} />
				)}

				{status === "quota_warning" && estimate && (
					<div className='flex-1 flex items-center justify-center p-4'>
						<Alert className='max-w-md border-warning bg-warning/10 text-warning-foreground [&>svg]:text-warning-foreground'>
							<AlertTriangle className='h-4 w-4' />
							<AlertTitle>Approaching rate limit</AlertTitle>
							<AlertDescription className='text-warning-foreground/90'>
								{estimate.remaining} requests remaining, {estimate.pointsNeeded}{" "}
								needed.{" "}
								{estimate.willExceed ?
									"This will likely exceed your quota."
								:	"You should have enough headroom."}
							</AlertDescription>
							<div className='flex gap-2 mt-3'>
								<Button size='sm' onClick={proceed}>
									Continue anyway
								</Button>
								<Button size='sm' variant='secondary' onClick={handleResetUser}>
									Switch user
								</Button>
							</div>
						</Alert>
					</div>
				)}

				{status === "error" && error && (
					<ErrorView
						message={error}
						resetAt={resetAt}
						partialCount={partialCount}
						onRetry={retry}
						onSwitchUser={handleResetUser}
					/>
				)}

				{status === "success" && currentAudience && (
					<div className='flex flex-1 items-stretch min-h-0 w-full overflow-hidden relative'>
						<div ref={mapContainerRef} className='flex-1 relative overflow-hidden'>
							<div className='absolute top-3 sm:top-6 left-1/2 -translate-x-1/2 z-20 shadow-xl rounded-full bg-background/80 backdrop-blur-md border border-border/60 p-0.5 sm:p-1 max-w-[calc(100vw-2rem)] overflow-x-auto'>
								<Tabs
									value={audienceType}
									onValueChange={(v) =>
										dispatch({
											type: "SET_AUDIENCE_TYPE",
											payload: v as AudienceType
										})
									}>
									<TabsList className='bg-transparent h-8 sm:h-9'>
										{AUDIENCE_TABS.map((tab) => (
											<TabsTrigger
												key={tab.value}
												value={tab.value}
												className='rounded-full px-3 sm:px-6 text-xs sm:text-sm font-medium'>
												{tab.label}
											</TabsTrigger>
										))}
									</TabsList>
								</Tabs>
							</div>

							<div className='absolute bottom-6 right-3 sm:right-20 z-20'>
								<Tabs
									value={mapMode}
									onValueChange={(v) =>
										dispatch({ type: "SET_MODE", payload: v as MAP_MODE })
									}>
									<TabsList className='bg-background/80 backdrop-blur-md border border-border shadow-lg'>
										<TabsTrigger value='SPHERE'>2D</TabsTrigger>
										<TabsTrigger value='GLOBE'>3D</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>
							{size && size.width > 0 && size.height > 0 ?
								<WorldMap
									mapMode={mapMode}
									width={size.width}
									height={size.height}
									setCountry={setCountry}
									audience={currentAudience}
									selectedCountry={country}
									user={user}
									mapTypeLabel={
										AUDIENCE_TABS.find((t) => t.value === audienceType)?.label
										|| "Network"
									}
								/>
							:	<div className='absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground'>
									<Loader2 className='h-4 w-4 animate-spin' />
									Calculating map dimensions...
								</div>
							}
						</div>

						<div className='absolute right-0 top-1/2 -translate-y-1/2 z-20 hidden md:block'>
							<Button
								variant='secondary'
								onClick={() => setSheetOpen(true)}
								className='h-32 w-8 rounded-l-xl rounded-r-none border border-r-0 border-border/50 bg-card/80 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center p-0 hover:bg-card hover:w-9 transition-all'>
								<div className='-rotate-90 whitespace-nowrap text-[10px] font-bold text-muted-foreground uppercase tracking-widest'>
									Leaderboard
								</div>
							</Button>
						</div>
					</div>
				)}
			</main>

			<footer className='h-10 w-full border-t border-border bg-muted/40 px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground shrink-0'>
				<p>© 2026 GitCharta</p>
				<div className='flex gap-4'>
					<a href='#' className='hover:underline'>
						Privacy
					</a>
					<a href='#' className='hover:underline'>
						Terms
					</a>
				</div>
			</footer>
		</div>
	);
}
