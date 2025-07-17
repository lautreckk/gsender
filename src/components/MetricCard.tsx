
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color = "text-blue-500", 
  change, 
  trend = 'neutral' 
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {change && (
                <span className={cn(
                  "text-xs font-medium",
                  trend === 'up' && "text-green-600",
                  trend === 'down' && "text-red-600",
                  trend === 'neutral' && "text-muted-foreground"
                )}>
                  {change}
                </span>
              )}
            </div>
          </div>
          <div className={cn("p-3 rounded-full bg-muted", color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
