import { useEffect, useState } from "react";

export function useElementWidth<T extends HTMLElement>(): [(element: T | null) => void, number] {
	const [element, setElement] = useState<T | null>(null);
	const [width, setWidth] = useState(0);

	useEffect(() => {
		if (!element) return;
		const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
		observer.observe(element);
		return () => observer.disconnect();
	}, [element]);

	return [setElement, width];
}
