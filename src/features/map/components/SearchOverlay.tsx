import { useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { isValidLogin } from "@/features/audience";

interface SearchOverlayProps {
	activeLogin: string;
	isSearching: boolean;
	onSearch: (login: string) => void;
	onClear: () => void;
}

export function SearchOverlay({
	activeLogin,
	isSearching,
	onSearch,
	onClear
}: SearchOverlayProps) {
	const [isExpanded, setIsExpanded] = useState(!activeLogin);
	const [draft, setDraft] = useState("");
	const [touched, setTouched] = useState(false);

	const trimmed = draft.trim();
	const showError = touched && trimmed.length > 0 && !isValidLogin(trimmed);

	const handleOpenChange = (open: boolean) => {
		setIsExpanded(open);
		if (!open) {
			setDraft("");
			setTouched(false);
		}
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setTouched(true);

		if (!isValidLogin(trimmed)) return;

		onSearch(trimmed);
		handleOpenChange(false);
	};

	const handleClear = () => {
		onClear();
		handleOpenChange(false);
	};

	return (
		<Dialog.Root open={isExpanded} onOpenChange={handleOpenChange}>
			<Dialog.Trigger asChild>
				<button
					type='button'
					className='group flex items-center gap-2.5 rounded-full border border-border-edge bg-background/70 py-2 pl-3.5 pr-4 text-sm shadow-lg backdrop-blur-xl transition-all hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'>
					{isSearching ?
						<Loader2 className='h-4 w-4 shrink-0 animate-spin text-primary' />
					:	<Search className='h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground' />
					}
					<span className='font-medium text-foreground'>
						{activeLogin || "Search a GitHub login…"}
					</span>
				</button>
			</Dialog.Trigger>

			<Dialog.Portal>
				<Dialog.Overlay className='fixed inset-0 z-40 bg-background/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in' />
				<Dialog.Content className='fixed left-1/2 top-24 z-50 flex w-[min(90vw,26rem)] -translate-x-1/2 flex-col gap-2 rounded-floating border border-border-edge bg-card/95 p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200'>
					<Dialog.Title className='sr-only'>Search GitHub users</Dialog.Title>
					<Dialog.Description className='sr-only'>
						Enter a GitHub username to view their audience map.
					</Dialog.Description>

					<form onSubmit={handleSubmit} className='flex flex-col gap-2'>
						<div className='flex items-center gap-2'>
							<div className='relative flex-1'>
								<Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
								<Input
									autoFocus
									value={draft}
									onChange={(e) => setDraft(e.target.value)}
									onBlur={() => setTouched(true)}
									placeholder='e.g. torvalds'
									autoComplete='off'
									spellCheck={false}
									aria-invalid={showError}
									aria-label='GitHub username'
									className='h-11 rounded-xl pl-9 pr-3 text-sm'
								/>
							</div>
							<Dialog.Close asChild>
								<Button
									type='button'
									variant='ghost'
									size='icon'
									className='h-11 w-11 shrink-0 rounded-xl text-muted-foreground'
									aria-label='Close search'>
									<X className='h-4 w-4' />
								</Button>
							</Dialog.Close>
						</div>

						{showError && (
							<p role='alert' className='px-1 text-xs text-destructive'>
								That doesn't look like a valid GitHub username.
							</p>
						)}

						<div className='flex items-center justify-between gap-2 px-1'>
							{activeLogin ?
								<button
									type='button'
									onClick={handleClear}
									className='text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline'>
									Clear current search
								</button>
							:	<span className='text-xs text-muted-foreground'>
									Enter any public GitHub username
								</span>
							}
							<Button
								type='submit'
								size='sm'
								disabled={!trimmed}
								className='gap-1.5 rounded-lg'>
								Search
								<ArrowRight className='h-3.5 w-3.5' />
							</Button>
						</div>
					</form>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
