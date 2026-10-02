import { startOfDay } from "date-fns";
import { useEffect, useState } from "react";

const CHECK_INTERVAL_MS = 60_000;

export function useToday(): Date {
	const [today, setToday] = useState(() => startOfDay(new Date()));

	useEffect(() => {
		const refresh = (): void => {
			const now = startOfDay(new Date());
			setToday((previous) => (previous.getTime() === now.getTime() ? previous : now));
		};
		const interval = window.setInterval(refresh, CHECK_INTERVAL_MS);
		window.addEventListener("focus", refresh);
		document.addEventListener("visibilitychange", refresh);
		return () => {
			window.clearInterval(interval);
			window.removeEventListener("focus", refresh);
			document.removeEventListener("visibilitychange", refresh);
		};
	}, []);

	return today;
}
