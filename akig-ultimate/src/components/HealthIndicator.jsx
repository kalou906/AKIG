import { useEffect, useState } from "react";

export default function HealthIndicator() {
  const [healthy, setHealthy] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const response = await fetch("/api/health");
        if (!response.ok) {
          throw new Error("Health check failed");
        }
        setHealthy(true);
      } catch (error) {
        setHealthy(false);
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const className = healthy ? "bg-green-600 text-white" : "bg-red-600 text-white";

  return (
    <span className={`rounded px-2 py-1 text-xs ${className}`}>
      {healthy ? "OK" : "DOWN"}
    </span>
  );
}
