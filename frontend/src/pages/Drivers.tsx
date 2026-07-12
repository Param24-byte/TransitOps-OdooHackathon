import { useEffect, useState } from "react";
import api from "../lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { RefreshCw, UserPlus, Trash2, Ban } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { Skeleton } from "../components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../contexts/AuthContext";
import socket from "../lib/socket";


interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  contactNumber: string;
  safetyScore: number;
  status: "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED";
}

const driverSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  licenseNumber: z.string().min(5, "Invalid license format"),
  licenseCategory: z.enum(["LMV", "HMV", "MCWG"]),
  contactNumber: z.string().min(10, "Contact must be at least 10 digits").max(15, "Contact too long"),
});

type DriverFormValues = z.infer<typeof driverSchema>;

export default function Drivers() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    socket.on("tripUpdated", () => {
      setRefreshTrigger(prev => prev + 1);
    });
    return () => {
      socket.off("tripUpdated");
    };
  }, []);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: "",
      licenseNumber: "",
      licenseCategory: "HMV",
      contactNumber: "",
    },
  });

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/drivers");
      setDrivers(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching drivers",
        description: "Could not load the driver list.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [refreshTrigger]);

  const onSubmit = async (data: DriverFormValues) => {
    setIsSubmitting(true);
    try {
      await api.post("/drivers", data);
      toast({
        title: "Success",
        description: "Driver added successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
      fetchDrivers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to add driver",
        description: error.response?.data?.error || "An error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;
    try {
      await api.delete(`/drivers/${id}`);
      toast({
        title: "Deleted",
        description: "Driver removed successfully.",
      });
      fetchDrivers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete driver",
        description: error.response?.data?.error || "Could not delete driver.",
      });
    }
  };

  const handleSuspend = async (id: number) => {
    try {
      await api.put(`/drivers/${id}/suspend`);
      toast({
        title: "Suspended",
        description: "Driver has been suspended.",
      });
      fetchDrivers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to suspend driver",
        description: error.response?.data?.error || "Could not suspend driver.",
      });
    }
  };

  const getStatusBadge = (status: Driver["status"]) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>;
      case "ON_TRIP":
        return <Badge className="bg-blue-500 hover:bg-blue-600">On Trip</Badge>;
      case "OFF_DUTY":
        return <Badge variant="secondary">Off Duty</Badge>;
      case "SUSPENDED":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 font-semibold";
    if (score >= 80) return "text-amber-500 font-semibold";
    return "text-red-500 font-bold";
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
          <p className="text-slate-500 mt-2">Manage your drivers and view their safety scores.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={fetchDrivers} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          
          {(user?.role === "FLEET_MANAGER" || user?.role === "SAFETY_OFFICER") && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" /> Add Driver
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Driver</DialogTitle>
                <DialogDescription>
                  Enter the driver's details to onboard them.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <div className="col-span-3">
                      <Input id="name" {...form.register("name")} placeholder="Ramesh Singh" />
                      {form.formState.errors.name && <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="license" className="text-right">License</Label>
                    <div className="col-span-3">
                      <Input id="license" {...form.register("licenseNumber")} placeholder="MH1420230000000" />
                      {form.formState.errors.licenseNumber && <p className="text-sm text-red-500 mt-1">{form.formState.errors.licenseNumber.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Category</Label>
                    <div className="col-span-3">
                      <Select value={form.watch("licenseCategory")} onValueChange={(val: any) => form.setValue("licenseCategory", val)}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LMV">LMV (Light Motor Vehicle)</SelectItem>
                          <SelectItem value="HMV">HMV (Heavy Motor Vehicle)</SelectItem>
                          <SelectItem value="MCWG">MCWG (Motorcycle with Gear)</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.licenseCategory && <p className="text-sm text-red-500 mt-1">{form.formState.errors.licenseCategory.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contact" className="text-right">Contact</Label>
                    <div className="col-span-3">
                      <Input id="contact" {...form.register("contactNumber")} placeholder="9876543210" />
                      {form.formState.errors.contactNumber && <p className="text-sm text-red-500 mt-1">{form.formState.errors.contactNumber.message}</p>}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Driver"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>License No.</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Safety Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No drivers found.
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.name}</TableCell>
                  <TableCell>{driver.licenseNumber}</TableCell>
                  <TableCell>{driver.licenseCategory}</TableCell>
                  <TableCell>{driver.contactNumber}</TableCell>
                  <TableCell className={getSafetyScoreColor(driver.safetyScore)}>
                    {driver.safetyScore}%
                  </TableCell>
                  <TableCell>{getStatusBadge(driver.status)}</TableCell>
                  <TableCell>
                    {(user?.role === "FLEET_MANAGER" || user?.role === "SAFETY_OFFICER") && (
                      <div className="flex gap-2">
                        {driver.status !== "SUSPENDED" && driver.status !== "ON_TRIP" && (
                          <Button variant="ghost" size="icon" onClick={() => handleSuspend(driver.id)} title="Suspend driver" className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(driver.id)} title="Delete driver" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
