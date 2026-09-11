import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, MapIcon, Menu, Workflow } from "lucide-react";
import { GithubIcon } from "@/shared/components/icons/lucide-github";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { useUserProfile } from "@/features/user-profile";
import { useSearchLogin } from "@/features/map/hooks/useSearchLogin";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { useState } from "react";

const NAV_TABS = [
	{ to: "/app/map", label: "Map", icon: MapIcon },
	{ to: "/app/analytics", label: "Analytics", icon: BarChart3 },
	{ to: "/app/automate", label: "Automate", icon: Workflow }
] as const;

function NavTabs({
	login,
	onNavigate
}: {
	login: string;
	onNavigate?: () => void;
}) {
	return (
		<>
			{NAV_TABS.map((tab) => (
				<NavLink
					key={tab.to}
					to={{ pathname: tab.to, search: login ? `?login=${login}` : "" }}
					onClick={onNavigate}
					className={({ isActive }) =>
						`relative flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
							isActive ?
								"bg-background text-foreground shadow-sm ring-1 ring-border/50"
							:	"text-muted-foreground hover:bg-muted hover:text-foreground"
						}`
					}>
					{({ isActive }) => (
						<>
							<tab.icon
								className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "opacity-70"}`}
							/>
							{tab.label}
						</>
					)}
				</NavLink>
			))}
		</>
	);
}

export function AppShell() {
	const isMobile = useMediaQuery("(max-width: 767px)");
	const { login } = useSearchLogin();
	const user = useUserProfile(login);
	const [mobileNavOpen, setMobileNavOpen] = useState(false);

	return (
		<div className='flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground'>
			<header className='relative z-50 shrink-0 border-b border-border/40 bg-background/90 px-4 py-2 backdrop-blur-xl'>
				<div className='mx-auto grid h-12 max-w-screen-2xl grid-cols-2 items-center gap-4 md:grid-cols-3'>
					<div className='flex min-w-0 items-center justify-self-start gap-3'>
						{user ?
							<>
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
							</>
						:	<span className='text-sm font-medium tracking-tight text-muted-foreground'>
								GitCharta
							</span>
						}
					</div>

					<nav
						aria-label='Main'
						className='hidden justify-self-center rounded-full border border-border/50 bg-muted/40 p-1 md:flex'>
						<NavTabs login={login} />
					</nav>

					<div className='flex items-center gap-4 justify-self-end'>
						{isMobile && (
							<Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
								<SheetTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										aria-label='Open navigation menu'
										className='h-9 w-9 text-muted-foreground'>
										<Menu className='h-4 w-4' />
									</Button>
								</SheetTrigger>
								<SheetContent side='right' className='w-64'>
									<SheetHeader>
										<SheetTitle className='text-xs font-bold uppercase tracking-widest text-primary'>
											Navigate
										</SheetTitle>
									</SheetHeader>
									<nav aria-label='Main' className='mt-4 flex flex-col gap-1 px-2'>
										<NavTabs
											login={login}
											onNavigate={() => setMobileNavOpen(false)}
										/>
									</nav>
								</SheetContent>
							</Sheet>
						)}

						{!isMobile && user && (
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

						<a
							href='https://github.com/ThierryRakotomanana/Github-Audience-Atlas'
							target='_blank'
							rel='noreferrer'
							className='flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'>
							<GithubIcon className='h-4 w-4' />
						</a>
					</div>
				</div>
			</header>

			<main className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
				<Outlet />
			</main>
		</div>
	);
}
