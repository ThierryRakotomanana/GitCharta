import { Component, type ReactNode } from "react";
import { Button } from "@/shared/components/ui/button";

interface Props {
	children: ReactNode;
	onReset?: () => void;
}

interface State {
	hasError: boolean;
}

export class MapErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: unknown) {
		console.error("Map rendering failed:", error);
	}

	private handleReset = () => {
		this.setState({ hasError: false });
		this.props.onReset?.();
	};

	render() {
		if (this.state.hasError) {
			return (
				<div className='flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground'>
					<p>Something went wrong rendering the map.</p>
					<Button variant='outline' size='sm' onClick={this.handleReset}>
						Try again
					</Button>
				</div>
			);
		}
		return this.props.children;
	}
}
