import {
	ArrowRight,
	BadgeCheck,
	Camera,
	Ghost,
	GitFork,
	GitPullRequest,
	Lock,
	Mail,
	Percent,
	Star,
	UserMinus,
	UserPlus,
	Users,
	ZoomIn
} from "lucide-react";
import { GithubIcon } from "@/components/icons/lucide-github";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PRODUCT_NAME = "GitCharta";
const AUTHOR_NAME = "Thierry";

const REPO_URL = "https://github.com/ThierryRakotomanana/Github-Audience-Atlas";
const GITHUB_URL = "https://github.com/ThierryRakotomanana";
const TWITTER_URL = "https://twitter.com/ThieryRakt";

const EXAMPLE_PROFILE = {
	login: "torvalds",
	name: "Linus Torvalds",
	avatarUrl: "https://github.com/torvalds.png",
	followers: 313000,
	following: 0,
	location: "Portland, OR",
	coordinates: "45.52°N · 122.68°W",
	org: "Linux Foundation"
} as const;

const STEPS = [
	{
		title: "Connect",
		body: "Enter your GitHub username and a personal access token.",
		visual: ConnectVisual
	},
	{
		title: "Fetch & sort",
		body: "GitCharta pulls your followers and following, works out their countries, and sorts every account into one of four categories.",
		visual: FetchVisual
	},
	{
		title: "Explore",
		body: "Browse the map, filter by category or country, and see exactly how far your reach really goes.",
		visual: ExploreVisual
	}
] as const;

const CATEGORIES = [
	{
		icon: Users,
		title: "Follower",
		body: "Someone who follows you : part of your confirmed audience."
	},
	{
		icon: UserPlus,
		title: "Following",
		body: "Someone you follow : the people and projects you learn from."
	},
	{
		icon: UserMinus,
		title: "Non-reciprocal",
		body: "You follow them, they don't follow back. A real account, just a one-way relationship."
	},
	{
		icon: Ghost,
		title: "Possible spam",
		body: "Accounts that look automated or inactive : flagged and set aside so they don't inflate your reach."
	}
] as const;

const ROADMAP = [
	{
		icon: Star,
		title: "Stargazer maps",
		body: "See where the people starring your repos are based : reach beyond your social graph."
	},
	{
		icon: GitFork,
		title: "Fork maps",
		body: "See where the people forking your projects are located."
	},
	{
		icon: GitPullRequest,
		title: "Contributor & PR maps",
		body: "Plot everyone who's opened a PR against your repos or organization."
	},
	{
		icon: Camera,
		title: "Map screenshots",
		body: "Export your map as an image to share or drop into a README."
	},
	{
		icon: ZoomIn,
		title: "Zoom & pan",
		body: "Get in close on any region instead of squinting at the whole world."
	},
	{
		icon: BadgeCheck,
		title: "Profile badge",
		body: "Embed a live badge of your map straight into your GitHub profile README."
	},
	{
		icon: Percent,
		title: "Coverage badge",
		body: "A badge showing what percentage of the world your reach covers."
	}
] as const;

function PinMark({
	className = "",
	label
}: {
	className?: string;
	label?: string;
}) {
	return (
		<svg viewBox='0 0 24 26' className={className} aria-hidden='true'>
			<path
				d='M12 1.5 20 8.5C20 15 12 24.5 12 24.5C12 24.5 4 15 4 8.5L12 1.5Z'
				fill='var(--muted)'
				stroke='var(--border)'
				strokeWidth={1.25}
				strokeLinejoin='round'
			/>
			{label ?
				<text
					x='12'
					y='11.5'
					textAnchor='middle'
					fontSize='7'
					fontFamily='ui-monospace, monospace'
					fontWeight={600}
					fill='var(--foreground)'>
					{label}
				</text>
			:	<circle cx='12' cy='9' r='3' fill='hsl(var(--signal))' />}
		</svg>
	);
}

function ConnectVisual() {
	return (
		<div
			className='rounded-lg border border-border bg-muted/30 p-3 space-y-2'
			aria-hidden='true'>
			<div className='flex items-center gap-2'>
				<span className='w-12 shrink-0 text-[9px] font-mono text-muted-foreground'>
					user
				</span>
				<span className='flex-1 h-5 rounded border border-border bg-background px-2 flex items-center text-[10px] font-mono truncate'>
					torvalds
				</span>
			</div>
			<div className='flex items-center gap-2'>
				<span className='w-12 shrink-0 text-[9px] font-mono text-muted-foreground'>
					token
				</span>
				<span className='flex-1 h-5 rounded border border-border bg-background px-2 flex items-center gap-0.5'>
					{Array.from({ length: 8 }).map((_, i) => (
						<span key={i} className='w-1 h-1 rounded-full bg-muted-foreground/60' />
					))}
				</span>
				<Lock className='h-3 w-3 text-muted-foreground shrink-0' />
			</div>
		</div>
	);
}

function FetchVisual() {
	const lines = [
		"fetching followers…",
		"resolving countries…",
		"296 real · 22 non-reciprocal · 6 spam"
	];
	return (
		<div
			className='rounded-lg border border-border bg-muted/30 p-3 font-mono text-[10px] leading-relaxed'
			aria-hidden='true'>
			{lines.map((line, i) => (
				<p
					key={line}
					className={
						i === lines.length - 1 ? "text-foreground" : "text-muted-foreground"
					}>
					<span className='text-muted-foreground/70'>{">"}</span> {line}
				</p>
			))}
			<span className='motion-safe:animate-pulse inline-block w-1.5 h-3 bg-foreground/60 align-middle' />
		</div>
	);
}

function ExploreVisual() {
	const dots = [
		{ x: 20, y: 30 },
		{ x: 55, y: 15 },
		{ x: 80, y: 40 },
		{ x: 40, y: 50 },
		{ x: 65, y: 22 }
	];
	return (
		<div
			className='rounded-lg border border-border bg-muted/30 p-3'
			aria-hidden='true'>
			<svg viewBox='0 0 100 60' className='w-full h-12'>
				{Array.from({ length: 5 }).map((_, i) => (
					<line
						key={`gv-${i}`}
						x1={i * 25}
						y1={0}
						x2={i * 25}
						y2={60}
						stroke='var(--border)'
						strokeWidth={0.5}
					/>
				))}
				{Array.from({ length: 4 }).map((_, i) => (
					<line
						key={`gh-${i}`}
						x1={0}
						y1={i * 20}
						x2={100}
						y2={i * 20}
						stroke='var(--border)'
						strokeWidth={0.5}
					/>
				))}
				{dots.map((d, i) => (
					<circle key={i} cx={d.x} cy={d.y} r={2} fill='hsl(var(--signal))' />
				))}
			</svg>
			<p className='mt-1 text-[9px] font-mono text-muted-foreground text-center'>
				34 countries reached
			</p>
		</div>
	);
}

export default function LandingPage({ onSubmit }: { onSubmit: () => void }) {
	const scrollToId = (id: string) => {
		document
			.getElementById(id)
			?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	return (
		<div className='min-h-screen w-full bg-background text-foreground'>
			<div className='min-h-screen flex flex-col'>
				<header className='max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 flex items-center justify-between'>
					<span className='flex items-center gap-2'>
						<PinMark className='w-4 h-4.5 text-foreground' />
						<span className='text-sm font-medium tracking-tight'>
							{PRODUCT_NAME}
						</span>
					</span>
					<a
						href={REPO_URL}
						target='_blank'
						rel='noreferrer'
						className='p-2.5 -mr-2.5 text-muted-foreground hover:text-foreground transition-colors'
						aria-label='GitHub Repository'>
						<GithubIcon />
					</a>
				</header>

				<section className='flex-1 flex items-center overflow-hidden'>
					<div className='max-w-6xl mx-auto w-full px-4 sm:px-6 py-10'>
						<div className='grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative'>
							<div className='relative z-10'>
								<div className='hidden lg:block absolute -inset-y-8 -inset-x-8 z-[-1] bg-background/[0.85] backdrop-blur-md rounded-3xl' />

								<p className='font-mono text-xs text-muted-foreground'>
									<span className='text-foreground/70'>$</span> gitcharta --reach{" "}
									{EXAMPLE_PROFILE.login}
								</p>
								<h1 className='mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight'>
									Every star, fork, and follow is a country you've reached.
								</h1>
								<p className='mt-4 text-base text-muted-foreground leading-relaxed max-w-md'>
									Followers, stars, forks, PRs : GitHub gives you raw counts.{" "}
									{PRODUCT_NAME} turns your whole footprint into a map, so you see
									exactly how far your work travels : and someone on it might be the
									first person from their country to reach you.
								</p>
								<div className='mt-7 flex flex-col sm:flex-row sm:items-center gap-3'>
									<Button size='lg' onClick={onSubmit} className='gap-2'>
										Map my reach
										<ArrowRight className='h-4 w-4' />
									</Button>
									<Button
										size='lg'
										variant='ghost'
										onClick={() => scrollToId("how-it-works")}
										className='text-muted-foreground'>
										See how it works
									</Button>
								</div>
							</div>
							<div className='relative flex justify-center lg:justify-end z-0 pointer-events-none'>
								<div
									className='w-full lg:w-[160%] lg:-ml-[60%]'
									style={{
										WebkitMaskImage:
											"radial-gradient(ellipse at right center, black 40%, transparent 100%)",
										maskImage:
											"radial-gradient(ellipse at right center, black 40%, transparent 100%)"
									}}>
									<div className='relative rounded-xl bg-background/50 p-2 ring-1 ring-border/50 shadow-2xl backdrop-blur-sm'>
										<div className='overflow-hidden rounded-lg bg-muted shadow-sm'>
											<img
												src={"gitcharta.png"}
												alt=''
												className='w-full h-auto object-cover'
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>

			<div className='bg-background'>
				<section
					id='how-it-works'
					className='max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24 scroll-mt-6'>
					<h2 className='text-xl font-semibold tracking-tight'>How it works</h2>
					<div className='relative mt-8'>
						<div
							className='hidden md:block absolute left-0 right-0 top-4.5 border-t border-dashed border-border'
							aria-hidden='true'
						/>
						<div className='relative grid grid-cols-1 md:grid-cols-3 gap-8'>
							{STEPS.map((step, i) => {
								const Visual = step.visual;
								return (
									<div key={step.title}>
										<PinMark
											className='w-8 h-9'
											label={String(i + 1).padStart(2, "0")}
										/>
										<h3 className='mt-3 text-sm font-medium'>{step.title}</h3>
										<p className='mt-1.5 text-sm text-muted-foreground leading-relaxed'>
											{step.body}
										</p>
										<div className='mt-4'>
											<Visual />
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</section>
			</div>

			<div className='bg-muted/20'>
				<section className='max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24'>
					<div className='max-w-2xl'>
						<h2 className='text-xl font-semibold tracking-tight'>
							Not every connection is equal
						</h2>
						<p className='mt-2 text-sm text-muted-foreground leading-relaxed'>
							GitCharta sorts every account into one of four categories, so a
							genuine one-way follow never gets lumped in with a dead bot account
							skewing your numbers.
						</p>
					</div>
					<div className='mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6'>
						{CATEGORIES.map(({ icon: Icon, title, body }) => (
							<Card key={title} className='border-border'>
								<CardContent className='p-5'>
									<Icon className='h-5 w-5 text-muted-foreground' />
									<h3 className='mt-3 text-sm font-medium'>{title}</h3>
									<p className='mt-1.5 text-sm text-muted-foreground leading-relaxed'>
										{body}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</section>
			</div>

			<div className='bg-background'>
				<section
					id='whats-next'
					className='max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24 scroll-mt-6'>
					<div className='flex items-baseline justify-between gap-4'>
						<div>
							<h2 className='text-xl font-semibold tracking-tight'>What's next</h2>
							<p className='mt-2 text-sm text-muted-foreground leading-relaxed max-w-lg'>
								Followers and following are just the start. Stars, forks, and PRs
								all represent someone your work reached too.
							</p>
						</div>
						<span className='hidden sm:inline shrink-0 font-mono text-[11px] text-muted-foreground'>
							on the map, not yet shipped
						</span>
					</div>
					<div className='mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
						{ROADMAP.map(({ icon: Icon, title, body }) => (
							<div
								key={title}
								className='rounded-lg border border-dashed border-border p-5'>
								<div className='flex items-center justify-between'>
									<Icon className='h-5 w-5 text-muted-foreground' />
									<span className='rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground'>
										planned
									</span>
								</div>
								<h3 className='mt-3 text-sm font-medium'>{title}</h3>
								<p className='mt-1.5 text-sm text-muted-foreground leading-relaxed'>
									{body}
								</p>
							</div>
						))}
					</div>
				</section>
			</div>

			<div className='bg-muted/20'>
				<section
					id='get-in-touch'
					className='max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24 scroll-mt-6'>
					<div className='grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center'>
						<div>
							<h2 className='text-xl font-semibold tracking-tight'>Get in touch</h2>
							<p className='mt-2 text-sm text-muted-foreground leading-relaxed max-w-lg'>
								Hey, I'm {AUTHOR_NAME} : I built {PRODUCT_NAME}. I'm actively
								looking to grow my own network with people building interesting
								things, so if this resonated with you, don't be a stranger.
							</p>
						</div>
						<div className='flex flex-wrap gap-3'>
							<Button asChild variant='outline' className='gap-2'>
								<a href={GITHUB_URL} target='_blank' rel='noreferrer'>
									<GithubIcon className='h-4 w-4' />
									Follow on GitHub
								</a>
							</Button>
							<Button asChild variant='outline' className='gap-2'>
								<a href={TWITTER_URL} target='_blank' rel='noreferrer'>
									<Mail className='h-4 w-4' />
									Say hi on Twitter
								</a>
							</Button>
						</div>
					</div>
				</section>
			</div>

			<footer className='border-t border-border'>
				<div className='max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground'>
					<p>© 2026 {PRODUCT_NAME}</p>
					<div className='flex gap-4'>
						<a href='#' className='hover:underline'>
							Privacy
						</a>
						<a href='#' className='hover:underline'>
							Terms
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
