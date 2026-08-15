"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
	return <SheetPrimitive.Root data-slot='sheet' {...props} />;
}

function SheetTrigger({
	...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
	return <SheetPrimitive.Trigger data-slot='sheet-trigger' {...props} />;
}

function SheetClose({
	...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
	return <SheetPrimitive.Close data-slot='sheet-close' {...props} />;
}

function SheetPortal({
	...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
	return <SheetPrimitive.Portal data-slot='sheet-portal' {...props} />;
}

function SheetOverlay({
	visible,
	className,
	...props
}: React.ComponentProps<"div"> & { visible: boolean }) {
	return (
		<div
			data-slot='sheet-overlay'
			aria-hidden
			className={cn(
				"fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-[opacity,backdrop-filter] duration-300 ease-out",
				visible ? "opacity-100" : (
					"pointer-events-none opacity-0 backdrop-blur-none"
				),
				className
			)}
			{...props}
		/>
	);
}

function SheetContent({
	className,
	overlayVisible = true,
	children,
	side = "right",
	showCloseButton = true,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
	side?: "top" | "right" | "bottom" | "left";
	showCloseButton?: boolean;
	overlayVisible?: boolean;
}) {
	return (
		<SheetPortal>
			<SheetOverlay visible={overlayVisible} />
			<SheetPrimitive.Content
				data-slot='sheet-content'
				data-side={side}
				className={cn(
					"fixed z-50 flex flex-col bg-background/95 backdrop-blur-xl shadow-2xl",
					"data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:border-t",
					"data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:sm:max-w-md",
					"data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:sm:max-w-md",
					"data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:border-b",
					"data-open:animate-in data-closed:animate-out",
					"data-[side=bottom]:data-open:slide-in-from-bottom-1/2 data-[side=bottom]:data-closed:slide-out-to-bottom-1/2",
					"data-[side=left]:data-open:slide-in-from-left-1/2 data-[side=left]:data-closed:slide-out-to-left-1/2",
					"data-[side=right]:data-open:slide-in-from-right-1/2 data-[side=right]:data-closed:slide-out-to-right-1/2",
					"data-[side=top]:data-open:slide-in-from-top-1/2 data-[side=top]:data-closed:slide-out-to-top-1/2",
					className
				)}
				{...props}>
				{children}
				{showCloseButton && (
					<SheetPrimitive.Close data-slot='sheet-close' asChild>
						<Button
							variant='ghost'
							size='icon'
							className='absolute right-4 top-4 rounded-full h-8 w-8 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'>
							<XIcon className='h-4 w-4' />
							<span className='sr-only'>Close</span>
						</Button>
					</SheetPrimitive.Close>
				)}
			</SheetPrimitive.Content>
		</SheetPortal>
	);
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot='sheet-header'
			className={cn(
				"flex flex-col gap-1.5 p-6 border-b border-border/40",
				className
			)}
			{...props}
		/>
	);
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot='sheet-footer'
			className={cn(
				"mt-auto flex flex-col gap-2 p-6 border-t border-border/40",
				className
			)}
			{...props}
		/>
	);
}

function SheetTitle({
	className,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
	return (
		<SheetPrimitive.Title
			data-slot='sheet-title'
			className={cn(
				"text-lg font-semibold tracking-tight text-foreground",
				className
			)}
			{...props}
		/>
	);
}

function SheetDescription({
	className,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
	return (
		<SheetPrimitive.Description
			data-slot='sheet-description'
			className={cn("text-sm text-muted-foreground leading-relaxed", className)}
			{...props}
		/>
	);
}

export {
	Sheet,
	SheetTrigger,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetFooter,
	SheetTitle,
	SheetDescription
};
