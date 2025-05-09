import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface ReadyBadgeProps {
  ready: boolean;
  className?: string;
}

export function ReadyBadge({ ready, className }: ReadyBadgeProps) {
  return (
    <Badge 
      variant={ready ? "default" : "outline"} 
      className={cn(
        ready ? "bg-green-100 text-green-800" : "",
        className
      )}
    >
      {ready ? "Ready" : "Not Ready"}
    </Badge>
  );
}