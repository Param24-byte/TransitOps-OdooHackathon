import { useEffect, useState } from "react";
import api from "../lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Truck, Map, AlertTriangle, IndianRupee } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [vehiclesRes, tripsRes, expensesRes] = await Promise.all([
          api.get("/vehicles/stats"),
          api.get("/trips/stats"),
          api.get("/expenses/summary?period=month"),
        ]);
        
        setStats({
          vehicles: vehiclesRes.data.data,
          trips: tripsRes.data.data,
          expenses: expensesRes.data.data,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8">Loading dashboard data...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-slate-500 mt-2">
          Welcome back, {user?.name}. Here's what's happening today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Vehicles Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Truck className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.vehicles?.total || 0}</div>
            <p className="text-xs text-slate-500">
              {stats?.vehicles?.available || 0} available for dispatch
            </p>
          </CardContent>
        </Card>

        {/* Trips Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
            <Map className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.trips?.dispatched || 0}</div>
            <p className="text-xs text-slate-500">
              {stats?.trips?.completed || 0} completed today
            </p>
          </CardContent>
        </Card>

        {/* Maintenance Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.vehicles?.inShop || 0}</div>
            <p className="text-xs text-slate-500">
              Vehicles currently in shop
            </p>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <IndianRupee className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.expenses?.total?.toLocaleString() || 0}</div>
            <p className="text-xs text-slate-500">
              Fuel, maintenance, and tolls
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Chart Section Placeholder */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Fleet Activity</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-md text-slate-400">
              Chart implementation pending
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-amber-500" />
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">MH-01-GH-3456</p>
                  <p className="text-sm text-slate-500">Maintenance scheduled tomorrow</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-red-500" />
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">MH-14-CD-5678</p>
                  <p className="text-sm text-slate-500">Route deviation alert</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
