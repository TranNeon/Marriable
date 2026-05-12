import { useEffect, useRef, useState } from "react";
import { cn } from "#/lib/utils";

type AvatarProps = {
	src: string;
	alt: string;
	className?: string;
	fallback?: string;
};

/**
 * Detects the primary face in an image and returns the optimal CSS object-position.
 * Uses the browser FaceDetector API (Chromium) with a fallback to "50% 20%".
 */
async function getFacePosition(src: string): Promise<string> {
	// FaceDetector is only available in Chromium-based browsers
	if (typeof window === "undefined" || !("FaceDetector" in window)) {
		return "50% 20%";
	}
	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = async () => {
			try {
				// @ts-ignore - FaceDetector is not in TS lib yet
				const detector = new window.FaceDetector({ fastMode: true });
				const faces = await detector.detect(img);
				if (faces.length === 0) {
					resolve("50% 20%");
					return;
				}
				const { top, left, width, height } = faces[0].boundingBox;
				const cx = ((left + width / 2) / img.naturalWidth) * 100;
				const cy = ((top + height / 2) / img.naturalHeight) * 100;
				resolve(`${cx.toFixed(1)}% ${cy.toFixed(1)}%`);
			} catch {
				resolve("50% 20%");
			}
		};
		img.onerror = () => resolve("50% 20%");
		img.src = src;
	});
}

export function Avatar({ src, alt, className, fallback }: AvatarProps) {
	const [objectPosition, setObjectPosition] = useState("50% 20%");
	const [error, setError] = useState(false);
	const hasRun = useRef(false);

	useEffect(() => {
		if (hasRun.current) return;
		hasRun.current = true;
		getFacePosition(src).then(setObjectPosition);
	}, [src]);

	if (error && fallback) {
		return (
			<span
				className={cn(
					"flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold select-none",
					className,
				)}
				aria-label={alt}
			>
				{fallback}
			</span>
		);
	}

	return (
		<img
			src={src}
			alt={alt}
			onError={() => setError(true)}
			className={cn("rounded-full object-cover", className)}
			style={{ objectPosition }}
		/>
	);
}
