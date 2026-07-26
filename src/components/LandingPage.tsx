import {
	ArrowRight,
	BadgeCheck,
	Camera,
	Ghost,
	Globe,
	List,
	Lock,
	Percent,
	Star,
	ZoomIn
} from "lucide-react";
import { GithubIcon } from "@/components/icons/lucide-github";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PRODUCT_NAME = "GitCharta";

const REPO_URL = "https://github.com/ThierryRakotomanana/Github-Audience-Atlas";

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
		title: "Fetch & locate",
		body: "GitCharta pulls your followers and following, then works out their countries from their public profiles.",
		visual: FetchVisual
	},
	{
		title: "Explore",
		body: "Browse the map, filter by country, and see who you follow that hasn't followed back.",
		visual: ExploreVisual
	}
] as const;

const FEATURES = [
	{
		icon: Globe,
		title: "World map",
		body: "Every follower and account you follow, plotted by country on a simple heat scale."
	},
	{
		icon: Ghost,
		title: "Ghost Zone",
		body: "See exactly who you follow that hasn't followed you bac: no more guessing."
	},
	{
		icon: List,
		title: "Country breakdown",
		body: "A searchable, ranked list of every country in your audience, with live percentages."
	}
] as const;

const ROADMAP = [
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
		icon: Star,
		title: "Stargazer maps",
		body: "See where the people starring your repos are based, not just your followers."
	},
	{
		icon: BadgeCheck,
		title: "Profile badge",
		body: "Embed a live badge of your map straight into your GitHub profile README."
	},
	{
		icon: Percent,
		title: "Coverage badge",
		body: "A badge showing what percentage of the world your audience covers."
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
		"318 located · 6 pending"
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
				34 countries mapped
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

				<section className='flex-1 flex items-center'>
					<div className='max-w-6xl mx-auto w-full px-4 sm:px-6 py-10'>
						<div className='grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center'>
							<div>
								<p className='font-mono text-xs text-muted-foreground'>
									<span className='text-foreground/70'>$</span> gitcharta --map{" "}
									{EXAMPLE_PROFILE.login}
								</p>
								<h1 className='mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight'>
									Your GitHub audience, charted.
								</h1>
								<p className='mt-4 text-base text-muted-foreground leading-relaxed max-w-md'>
									{PRODUCT_NAME} fetches your followers and following, works out
									where they're based, and plots them on a world map : including
									everyone you follow who hasn't followed back.
								</p>
								<div className='mt-7 flex flex-col sm:flex-row sm:items-center gap-3'>
									<Button size='lg' onClick={onSubmit} className='gap-2'>
										Map my followers
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

							<div className='flex justify-center'>
								<img src={"gitcharta.png"} alt='' />
								<img className='w-full max-w-85' />
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
					<h2 className='text-xl font-semibold tracking-tight'>What you get</h2>
					<div className='mt-8 grid grid-cols-1 md:grid-cols-3 gap-6'>
						{FEATURES.map(({ icon: Icon, title, body }) => (
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
						<h2 className='text-xl font-semibold tracking-tight'>What's next</h2>
						<span className='hidden sm:inline font-mono text-[11px] text-muted-foreground'>
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
