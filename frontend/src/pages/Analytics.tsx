import { useEffect, useState } from "react";
import api from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "../hooks/use-toast";

export default function Analytics() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get("/reports/operational-costs");
        setData(response.data.data);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load analytics data.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [toast]);

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading analytics...</div>;
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">Total expenses and operational costs across individual vehicles.</p>
      </div>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Total Expense per Vehicle</CardTitle>
          <CardDescription>A breakdown of total accumulated costs by vehicle registration.</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] w-full pt-4">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis 
                  dataKey="registrationNo" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  tick={{ fill: "currentColor", fontSize: 12 }} 
                  tickMargin={10}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis 
                  tickFormatter={(value) => `₹${value}`} 
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={{ stroke: "var(--border)" }}
                  width={80}
                />
                <Tooltip 
                  formatter={(value: any) => [`₹${Number(value ?? 0).toLocaleString()}`, "Total Expense"]}
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--card-foreground)", borderRadius: "8px" }}
                  itemStyle={{ color: "var(--primary)" }}
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ color: "currentColor" }} />
                <Bar 
                  dataKey="totalCost" 
                  name="Total Expense" 
                  fill="hsl(var(--primary))" 
                  radius={[6, 6, 0, 0]} 
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No expense data available for analytics.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
