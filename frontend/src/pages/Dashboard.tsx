import { useEffect, useState } from "react";
import api from "../lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Truck, Map, AlertTriangle, IndianRupee, Users, Clock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { motion } from "framer-motion";
import socket from "../lib/socket";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showManagerStats = user?.role && user.role !== "DRIVER";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    socket.on("tripUpdated", () => {
      setRefreshTrigger(prev => prev + 1);
    });
    return () => {
      socket.off("tripUpdated");
    };
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const regionQuery = regionFilter !== "all" ? `?region=${regionFilter}` : "";
        const [vehiclesRes, tripsRes, expensesRes, utilRes, driversRes] = await Promise.all([
          api.get(`/vehicles/stats${regionQuery}`),
          api.get("/trips/stats"),
          api.get("/expenses/summary?period=month"),
          api.get("/trips/utilization-chart"),
          api.get("/drivers/stats")
        ]);
        
        setStats({
          vehicles: vehiclesRes.data.data,
          trips: tripsRes.data.data,
          expenses: expensesRes.data.data,
          utilization: utilRes.data.data,
          drivers: driversRes.data.data,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [regionFilter, refreshTrigger]);

  if (loading) {
    return <div className="p-8">Loading dashboard data...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-slate-500 mt-2">
            Welcome back, {user?.name}. Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block bg-card/40 backdrop-blur-md px-4 py-2 rounded-lg border border-border/50 shadow-sm">
            <p className="font-semibold text-primary tracking-wider">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="w-48">
            <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="North">North</SelectItem>
              <SelectItem value="South">South</SelectItem>
              <SelectItem value="East">East</SelectItem>
              <SelectItem value="West">West</SelectItem>
            </SelectContent>
          </Select>
        </div>
        </div>
      </div>


      <motion.div 
        className="grid gap-4 md:grid-cols-3 lg:grid-cols-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Vehicles Card */}
        {showManagerStats && (
          <motion.div variants={item}>
          <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 bg-card/60 backdrop-blur-md border-border/50 h-full">
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
          </motion.div>
        )}

        {/* Trips Card */}
        <motion.div variants={item}>
        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 bg-card/60 backdrop-blur-md border-border/50 h-full">
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
        </motion.div>

        {/* Maintenance Card */}
        {showManagerStats && (
          <motion.div variants={item}>
          <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 bg-card/60 backdrop-blur-md border-border/50 h-full">
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
          </motion.div>
        )}

        {/* Pending Trips Card */}
        <motion.div variants={item}>
        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 bg-card/60 backdrop-blur-md border-border/50 h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Trips</CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.trips?.draft || 0}</div>
            <p className="text-xs text-slate-500">
              Trips awaiting dispatch
            </p>
          </CardContent>
        </Card>
        </motion.div>

        {/* Drivers On Duty Card */}
        {showManagerStats && (
          <motion.div variants={item}>
          <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 bg-card/60 backdrop-blur-md border-border/50 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drivers On Duty</CardTitle>
              <Users className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.drivers?.onTrip || 0}</div>
              <p className="text-xs text-slate-500">
                Drivers currently active
              </p>
            </CardContent>
          </Card>
          </motion.div>
        )}

        {/* Expenses Card */}
        {showManagerStats && (
          <motion.div variants={item}>
          <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 bg-card/60 backdrop-blur-md border-border/50 h-full">
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
          </motion.div>
        )}
      </motion.div>
      
      
      {/* Chart Section */}
      {showManagerStats && (
        <motion.div 
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-7"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="col-span-4 bg-card/60 backdrop-blur-md border-border/50 hover:shadow-md transition-all duration-300">
            <CardHeader>
              <CardTitle>Fleet Utilization</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats?.utilization?.chartData || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="trips" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3 bg-card/60 backdrop-blur-md border-border/50 hover:shadow-md transition-all duration-300">
            <CardHeader>
              <CardTitle>Vehicle Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Available', value: stats?.vehicles?.available || 0 },
                        { name: 'On Trip', value: stats?.vehicles?.onTrip || 0 },
                        { name: 'In Shop', value: stats?.vehicles?.inShop || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
