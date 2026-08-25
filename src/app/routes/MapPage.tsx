import { useReducer, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/shared/components/ui/dropdown-menu";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from "@/shared/components/ui/sheet";
import { Alert, AlertTitle, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { AlertTriangle, Filter, List, Loader2, WifiOff } from "lucide-react";
import { LoadingView } from "@/shared/components/LoadingView";
import { ErrorView } from "@/shared/components/ErrorView";
import { WorldMap, MapErrorBoundary } from "@/features/map";
import { useElementSize } from "@/shared/hooks/useElementSize";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { useAudience } from "@/features/audience/hooks/useAudience";
import { CountryList } from "@/features/leaderboard/components/CountryList";
import { SearchOverlay } from "@/features/map/components/SearchOverlay";
import { useSearchLogin } from "@/features/map/hooks/useSearchLogin";

type AudienceViewTab = "followers" | "following" | "ghosts";

const AUDIENCE_TABS: { value: AudienceViewTab; label: string; noun: string }[] = [
	{ value: "followers", label: "Followers", noun: "follower" },
	{ value: "following", label: "Following", noun: "followed account" },
	{ value: "ghosts", label: "Ghost Zone", noun: "ghost" }
];

type PageState = {
	country: string | null;
	audienceType: AudienceViewTab;
};

type PageAction =
	| { type: "SET_COUNTRY"; payload: string | null }
	| { type: "SET_AUDIENCE_TYPE"; payload: AudienceViewTab }
	| { type: "RESET" };

const initialState: PageState = { country: null, audienceType: "followers" };

function pageReducer(state: PageState, action: PageAction): PageState {
	switch (action.type) {
		case "SET_COUNTRY":
			return { ...state, country: action.payload };
		case "SET_AUDIENCE_TYPE":
			return { ...state, audienceType: action.payload, country: null };
		case "RESET":
			return initialState;
		default:
			return state;
	}
}

export function MapPage() {
	const { login, search, clear } = useSearchLogin();
	const [{ country, audienceType }, dispatch] = useReducer(
		pageReducer,
		initialState
	);
	const [sheetOpen, setSheetOpen] = useState(false);
	const isMobile = useMediaQuery("(max-width: 767px)");

	const hasSelection = country !== null;
	const backgroundLocked = sheetOpen && !hasSelection;

	const { ref: mapContainerRef, size } = useElementSize<HTMLDivElement>();
	const {
		status,
		steps,
		pct,
		user,
		audience,
		connectionIssue,
		partial,
		error,
		resetAt,
		partialCount,
		cancel,
		retry
	} = useAudience({ user: login });

	const currentNoun =
		AUDIENCE_TABS.find((t) => t.value === audienceType)?.noun ?? "follower";
	const currentAudience = audience?.[audienceType];

	const setCountry = (c: string | null) => {
		dispatch({ type: "SET_COUNTRY", payload: c });
		if (c) setSheetOpen(true);
	};

	const handleClearSearch = () => {
		cancel();
		dispatch({ type: "RESET" });
		clear();
	};

	return (
		<div className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
			{connectionIssue && (
				<div className='absolute top-3 left-1/2 z-50 -translate-x-1/2'>
					<Alert className='border-amber-500/50 bg-amber-500/10 text-amber-500 backdrop-blur-md py-2 px-4 shadow-lg'>
						<WifiOff className='h-4 w-4' />
						<AlertTitle className='text-xs font-semibold'>
							Reconnecting to server...
						</AlertTitle>
						<AlertDescription className='text-[11px] opacity-90'>
							Background job is active. Retrying polling automatically.
						</AlertDescription>
					</Alert>
				</div>
			)}

			{/* Search overlay: always present, floats above whichever state is active below. */}
			<div className='absolute inset-0 z-30 flex items-start justify-center pt-6'>
				<SearchOverlay
					activeLogin={login}
					isSearching={status === "loading"}
					onSearch={search}
					onClear={handleClearSearch}
				/>
			</div>

			{/* Status transitions cross-fade rather than hard-swap, so entering a
			    search feels like one continuous motion instead of a page flash. */}
			<div className='relative flex min-h-0 flex-1'>
				{status === "loading" && (
					<div className='absolute inset-0 z-20 flex flex-col bg-background/80 backdrop-blur-sm animate-in fade-in duration-300'>
						<LoadingView steps={steps} pct={pct} onCancel={handleClearSearch} />
					</div>
				)}

				{status === "error" && (
					<div className='absolute inset-0 z-20 flex flex-col bg-background animate-in fade-in duration-300'>
						<ErrorView
							message={error ?? "Something went wrong"}
							resetAt={resetAt}
							partialCount={partialCount}
							onRetry={retry}
							onSwitchUser={handleClearSearch}
						/>
					</div>
				)}

				{/* The map itself renders in both the idle (no search yet) and
				    success states — only its content changes — so there's no
				    remount/flash the moment a search resolves. */}
				<div
					className={`relative flex w-full min-h-0 flex-1 items-stretch overflow-hidden transition-opacity duration-500 ${
						status === "loading" ? "opacity-40" : "opacity-100"
					}`}>
					<div ref={mapContainerRef} className='relative flex-1 overflow-hidden'>
						{status === "success" && currentAudience && (
							<div className='absolute top-6 left-6 z-20 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300'>
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
														payload: tab.value
													})
												}
												className={`text-xs ${
													audienceType === tab.value ?
														"font-bold text-primary"
													:	"text-muted-foreground"
												}`}>
												{tab.label}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>

								{partial && (
									<div className='flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] text-blue-400 backdrop-blur-md'>
										<AlertTriangle className='h-3 w-3' />
										<span>Partial dataset — backfilling remaining history</span>
									</div>
								)}
							</div>
						)}

						{size && size.width > 0 && size.height > 0 ?
							<MapErrorBoundary onReset={() => setCountry(null)}>
								<WorldMap
									width={size.width}
									height={size.height}
									setCountry={setCountry}
									audience={currentAudience ?? []}
									selectedCountry={country}
									user={user}
									isMobile={isMobile}
									mapTypeLabel={
										AUDIENCE_TABS.find((t) => t.value === audienceType)?.label
										|| "Network"
									}
								/>
							</MapErrorBoundary>
						:	<div className='absolute inset-0 flex items-center justify-center gap-3 text-sm font-medium text-muted-foreground'>
								<Loader2 className='h-5 w-5 animate-spin' />
								Calculating map dimensions...
							</div>
						}
					</div>

					{status === "success" && currentAudience && (
						<>
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

							<Sheet open={sheetOpen} onOpenChange={setSheetOpen} modal={false}>
								<SheetTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										className='absolute right-4 top-4 z-20 h-9 w-9 text-muted-foreground md:hidden'
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
						</>
					)}
				</div>
			</div>
		</div>
	);
}
