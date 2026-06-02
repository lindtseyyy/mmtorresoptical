import { useState, useEffect, useRef } from "react";
import api from "@/shared/lib/axiosInstance";

const SystemClock: React.FC = () => {
  const [display, setDisplay] = useState({ time: "", date: "" });
  const offsetRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    api.get("/system/time").then((res) => {
      if (cancelled) return;
      const serverTimestamp: number = res.data;
      const localTimestamp = Date.now();
      offsetRef.current = serverTimestamp - localTimestamp;
    });

    const interval = setInterval(() => {
      const corrected = new Date(Date.now() + offsetRef.current);
      setDisplay({
        time: corrected.toLocaleTimeString("en-PH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
        date: corrected.toLocaleDateString("en-PH", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="mx-4 my-2 rounded-md border border-border bg-gray-50 px-3 py-2 text-center">
      <p className="font-mono text-sm font-medium text-foreground">{display.time}</p>
      <p className="text-xs text-muted-foreground">{display.date}</p>
    </div>
  );
};

export default SystemClock;
