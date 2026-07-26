import { useReducer, useState } from "react";

import CredentialForm from "./components/CredentialForm";
import LandingPage from "@/components/LandingPage";
import { LoadingView } from "./components/LoadingView";
import { ErrorView } from "@/components/ErrorView";
import { WorldMap } from "@/components/WorldMap";
import { CountryList } from "@/components/CountryList";
import { Stat } from "@/components/Stat";

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
import { AlertTriangle, List, Loader2, UserRound } from "lucide-react";
import { GithubIcon } from "@/components/icons/lucide-github";
import { Separator } from "@/components/ui/separator";
import type { Credentials } from "@/api/graphql.types";

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
		if (c && isMobile) setSheetOpen(true);
	};

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
				<header className='border-b border-border bg-card shrink-0'>
					<div className='max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 sm:gap-4'>
						<div className='flex items-center gap-3 min-w-0'>
							<img
								src={user.avatarUrl}
								alt={user.login}
								className='w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border shrink-0'
							/>
							<div className='flex-1 min-w-0'>
								<p className='text-xs sm:text-sm font-medium text-card-foreground truncate leading-tight'>
									{user.name ?? user.login}
								</p>
								<a
									href={user.url}
									target='_blank'
									rel='noreferrer'
									className='text-[11px] sm:text-xs text-muted-foreground font-mono hover:text-foreground transition-colors block truncate'>
									@{user.login}
								</a>
							</div>
						</div>

						<div className='flex items-center gap-3 sm:gap-4 shrink-0'>
							{!isMobile && (
								<div className='flex items-center gap-3 sm:gap-6'>
									<Stat label='Followers' value={user.followersCount} />
									<Stat label='Following' value={user.followingCount} />
								</div>
							)}
							<Separator orientation='vertical' className='hidden sm:block' />
							<div className='flex items-center gap-1 sm:gap-2'>
								<Button
									variant='secondary'
									size='sm'
									onClick={handleResetUser}
									title='Switch user'
									className='h-8 px-2 sm:px-3 gap-1.5 text-xs text-muted-foreground'>
									<UserRound className='h-4 w-4 shrink-0' />
									<span className='hidden sm:inline font-medium'>Switch User</span>
								</Button>
								<a
									href='https://github.com/ThierryRakotomanana/Github-Audience-Atlas'
									target='_blank'
									rel='noreferrer'
									className='p-2 text-muted-foreground hover:text-foreground'>
									<GithubIcon />
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
					<>
						<div className='border-b border-border bg-card shrink-0'>
							<div className='max-w-6xl mx-auto px-4 sm:px-6 py-1 flex items-center justify-between gap-3'>
								<Tabs
									value={audienceType}
									onValueChange={(v) =>
										dispatch({
											type: "SET_AUDIENCE_TYPE",
											payload: v as AudienceType
										})
									}>
									<TabsList className='bg-muted'>
										{AUDIENCE_TABS.map((tab) => (
											<TabsTrigger key={tab.value} value={tab.value}>
												{tab.label}
											</TabsTrigger>
										))}
									</TabsList>
								</Tabs>

								<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
									<SheetTrigger asChild>
										<Button
											variant='outline'
											size='icon'
											className='shrink-0 md:hidden'>
											<List className='h-4 w-4' />
										</Button>
									</SheetTrigger>
									<SheetContent side='right' className='w-72'>
										<SheetHeader>
											<SheetTitle>Countries</SheetTitle>
										</SheetHeader>
										<CountryList
											data={currentAudience}
											country={country}
											setCountry={setCountry}
										/>
									</SheetContent>
								</Sheet>
							</div>
						</div>

						<div className='flex flex-1 items-stretch min-h-0 w-full overflow-hidden'>
							<div
								ref={mapContainerRef}
								className='flex-1 relative overflow-hidden'>
								{size ?
									<WorldMap
										width={size.width}
										height={size.height}
										setCountry={setCountry}
										audience={currentAudience}
										selectedCountry={country}
									/>
								:	<div className='absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground'>
										<Loader2 className='h-4 w-4 animate-spin' />
										Calculating map dimensions...
									</div>
								}
							</div>
							<aside className='w-64 shrink-0 border-l border-border bg-card py-6 pl-6 pr-2 hidden md:block overflow-y-auto'>
								<CountryList
									data={currentAudience}
									country={country}
									setCountry={setCountry}
									label={currentNoun}
								/>
							</aside>
						</div>
					</>
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
