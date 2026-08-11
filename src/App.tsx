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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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
	Filter,
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

type AppState = {
	country: string | null;
	audienceType: AudienceType;
	credentials: Credentials;
};

type AppAction =
	| { type: "SET_COUNTRY"; payload: string | null }
	| { type: "SET_AUDIENCE_TYPE"; payload: AudienceType }
	| { type: "SET_CREDENTIALS"; payload: Credentials }
	| { type: "RESET_USER" };

const initialState: AppState = {
	country: null,
	audienceType: "followers",
	credentials: { user: "", token: "" }
};

function appReducer(state: AppState, action: AppAction): AppState {
	switch (action.type) {
		case "SET_COUNTRY":
			return { ...state, country: action.payload };
		case "SET_AUDIENCE_TYPE":
			return { ...state, audienceType: action.payload, country: null };
		case "SET_CREDENTIALS":
			return { ...state, credentials: action.payload };
		case "RESET_USER":
			return initialState;
		default:
			return state;
	}
}

export default function App() {
	const [{ country, audienceType, credentials }, dispatch] = useReducer(
		appReducer,
		initialState
	);

	const isMobile = useMediaQuery("(max-width: 767px)");
	const [sheetOpen, setSheetOpen] = useState(false);
	const [start, setStart] = useState(false);
	const [appView, setAppView] = useState("map");

	const hasSelection = country !== null;
	const backgroundLocked = sheetOpen && !hasSelection;

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

	if (!start) return <LandingPage onSubmit={() => setStart(true)} />;

	if (!credentials.user) {
		return (
			<CredentialForm
				onSubmit={(c) => dispatch({ type: "SET_CREDENTIALS", payload: c })}
			/>
		);
	}

	return (
		<div
			inert={backgroundLocked ? true : undefined}
			className='flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground'>
			{user && (
				<header className='relative z-50 shrink-0 border-b border-border/40 bg-background/90 px-4 py-2 backdrop-blur-xl'>
					<div className='mx-auto grid h-12 max-w-screen-2xl grid-cols-2 items-center gap-4 md:grid-cols-3'>
						<div className='flex min-w-0 items-center justify-self-start gap-3'>
							<Avatar className='h-9 w-9 shrink-0 ring-1 ring-border/60'>
								<AvatarImage src={user.avatarUrl} alt={user.login} />
								<AvatarFallback className='text-xs'>
									{user.login.slice(0, 2).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className='flex min-w-0 flex-col'>
								<span className='truncate text-sm font-medium tracking-tight'>
									{user.name ?? user.login}
								</span>
								<a
									href={user.url}
									target='_blank'
									rel='noreferrer'
									className='mt-0.5 truncate text-xs text-muted-foreground transition-colors hover:text-foreground'>
									@{user.login}
								</a>
							</div>
						</div>

						<div className='hidden justify-self-center rounded-full border border-border/50 bg-muted/40 p-1 md:flex'>
							{[
								{ id: "map", label: "Map", icon: MapIcon },
								{ id: "analytics", label: "Analytics", icon: BarChart3 },
								{ id: "automate", label: "Automate", icon: Workflow }
							].map((tab) => (
								<button
									key={tab.id}
									onClick={() => setAppView(tab.id)}
									className={`relative flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
										appView === tab.id ?
											"bg-background text-foreground shadow-sm ring-1 ring-border/50"
										:	"text-muted-foreground hover:bg-muted hover:text-foreground"
									}`}>
									<tab.icon
										className={`h-3.5 w-3.5 ${
											appView === tab.id ? "text-primary" : "opacity-70"
										}`}
									/>
									{tab.label}
								</button>
							))}
						</div>

						<div className='flex items-center gap-4 justify-self-end'>
							{!isMobile && (
								<div className='hidden items-center gap-6 border-r border-border/40 pr-6 lg:flex'>
									<div className='flex items-baseline gap-2'>
										<span className='text-sm font-semibold tabular-nums tracking-tight'>
											{user.followersCount.toLocaleString()}
										</span>
										<span className='text-[10px] font-medium uppercase tracking-widest text-muted-foreground'>
											Followers
										</span>
									</div>
									<div className='flex items-baseline gap-2'>
										<span className='text-sm font-semibold tabular-nums tracking-tight'>
											{user.followingCount.toLocaleString()}
										</span>
										<span className='text-[10px] font-medium uppercase tracking-widest text-muted-foreground'>
											Following
										</span>
									</div>
								</div>
							)}

							<div className='flex items-center gap-2'>
								{status === "success" && currentAudience && (
									<Sheet
										open={sheetOpen}
										onOpenChange={(open) => {
											setSheetOpen(open);
										}}
										modal={false}>
										<SheetTrigger asChild>
											<Button
												variant='ghost'
												size='icon'
												className='h-9 w-9 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground md:hidden'
												title='Open Leaderboard'>
												<List className='h-4 w-4' />
											</Button>
										</SheetTrigger>

										<SheetContent
											side='right'
											overlayVisible={backgroundLocked}
											onInteractOutside={(e) => {
												if (hasSelection) e.preventDefault();
											}}
											className='w-full flex-col p-0 sm:w-[400px]'>
											<SheetHeader className='bg-muted/20'>
												<SheetTitle className='text-xs font-bold uppercase tracking-widest text-primary'>
													Global Distribution
												</SheetTitle>
											</SheetHeader>
											<div className='flex-1 overflow-hidden p-6 pt-4'>
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
									className='h-9 w-9 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground'>
									<ArrowRightLeft className='h-4 w-4' />
								</Button>

								<a
									href='https://github.com/ThierryRakotomanana/Github-Audience-Atlas'
									target='_blank'
									rel='noreferrer'
									className='flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'>
									<GithubIcon className='h-4 w-4' />
								</a>
							</div>
						</div>
					</div>
				</header>
			)}

			<main className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
				{status === "loading" && (
					<LoadingView steps={steps} pct={pct} onCancel={handleResetUser} />
				)}

				{status === "quota_warning" && estimate && (
					<div className='flex flex-1 items-center justify-center p-6'>
						<Alert className='max-w-md border-warning bg-warning/10 text-warning-foreground'>
							<AlertTriangle className='h-4 w-4' />
							<AlertTitle>Approaching rate limit</AlertTitle>
							<AlertDescription className='text-warning-foreground/90'>
								{estimate.remaining} requests remaining, {estimate.pointsNeeded}{" "}
								needed.
								{estimate.willExceed ?
									" This will likely exceed your quota."
								:	" You should have enough headroom."}
							</AlertDescription>
							<div className='mt-4 flex gap-3'>
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
					<div className='relative flex w-full min-h-0 flex-1 items-stretch overflow-hidden'>
						<div ref={mapContainerRef} className='relative flex-1 overflow-hidden'>
							<div className='absolute top-6 left-6 z-20'>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant='secondary'
											className='h-9 gap-2 rounded-full border border-border/40 bg-background/60 px-4 text-xs font-medium shadow-lg backdrop-blur-xl hover:bg-background/80'>
											<Filter className='h-3.5 w-3.5' />
											{AUDIENCE_TABS.find((t) => t.value === audienceType)?.label}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align='start'
										className='w-40 rounded-xl bg-background/95 backdrop-blur-xl'>
										{AUDIENCE_TABS.map((tab) => (
											<DropdownMenuItem
												key={tab.value}
												onClick={() =>
													dispatch({
														type: "SET_AUDIENCE_TYPE",
														payload: tab.value as AudienceType
													})
												}
												className={`text-xs ${audienceType === tab.value ? "font-bold text-primary" : "text-muted-foreground"}`}>
												{tab.label}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							{size && size.width > 0 && size.height > 0 ?
								<WorldMap
									width={size.width}
									height={size.height}
									setCountry={setCountry}
									audience={currentAudience}
									selectedCountry={country}
									user={user}
									isMobile={isMobile}
									mapTypeLabel={
										AUDIENCE_TABS.find((t) => t.value === audienceType)?.label
										|| "Network"
									}
								/>
							:	<div className='absolute inset-0 flex items-center justify-center gap-3 text-sm font-medium text-muted-foreground'>
									<Loader2 className='h-5 w-5 animate-spin' />
									Calculating map dimensions...
								</div>
							}
						</div>

						<div className='absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 md:block'>
							<Button
								variant='secondary'
								onClick={() => setSheetOpen(true)}
								className='flex h-36 w-8 flex-col items-center justify-center rounded-l-xl rounded-r-none border border-r-0 border-border/50 bg-card/90 p-0 shadow-2xl backdrop-blur-xl transition-all hover:w-10 hover:bg-card focus-visible:ring-2 focus-visible:ring-primary'>
								<div className='-rotate-90 whitespace-nowrap text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
									Leaderboard
								</div>
							</Button>
						</div>
					</div>
				)}
			</main>

			<footer className='hidden h-12 shrink-0 items-center justify-between border-t border-border bg-muted/30 px-6 text-xs text-muted-foreground sm:flex'>
				<p>© 2026 GitCharta</p>
				<div className='flex gap-6'>
					<a href='#' className='transition-colors hover:text-foreground'>
						Privacy
					</a>
					<a href='#' className='transition-colors hover:text-foreground'>
						Terms
					</a>
				</div>
			</footer>
		</div>
	);
}
