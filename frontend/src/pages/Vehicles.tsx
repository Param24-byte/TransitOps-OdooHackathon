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
import { RefreshCw, Plus, Trash2, Archive, Pencil } from "lucide-react";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { useToast } from "../hooks/use-toast";
import { Skeleton } from "../components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../contexts/AuthContext";
import socket from "../lib/socket";



interface Vehicle {
  id: number;
  registrationNo: string;
  name: string;
  type: string;
  capacity: number;
  odometer: number;
  acquisitionCost: number;
  region?: string;
  status: "AVAILABLE" | "IN_SHOP" | "ON_TRIP" | "RETIRED";
}

const vehicleSchema = z.object({
  registrationNo: z.string().regex(
    /^[A-Za-z]{2}-\d{1,2}-[A-Za-z]{1,2}-\d{4}$/,
    "Must follow format: 2 letters - number - letter - 4 digit number (e.g., MH-12-A-1234)"
  ),
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["Light Truck", "Medium Truck", "Heavy Truck"]),
  capacity: z.coerce.number().min(100, "Capacity must be at least 100 kg").max(50000, "Capacity is too large"),
  odometer: z.coerce.number().min(0, "Odometer cannot be negative"),
  acquisitionCost: z.coerce.number().min(0, "Cost cannot be negative"),
  region: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export default function Vehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema) as any,
    defaultValues: {
      registrationNo: "",
      name: "",
      type: "Light Truck",
      capacity: 0,
      odometer: 0,
      acquisitionCost: 0,
      region: "",
    },
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const regionQuery = regionFilter !== "all" ? `?region=${regionFilter}` : "";
      const response = await api.get(`/vehicles${regionQuery}`);
      setVehicles(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching vehicles",
        description: "Could not load the vehicle fleet.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [regionFilter, refreshTrigger]);

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    form.reset({
      registrationNo: vehicle.registrationNo,
      name: vehicle.name,
      type: vehicle.type as "Light Truck" | "Medium Truck" | "Heavy Truck",
      capacity: vehicle.capacity,
      odometer: vehicle.odometer,
      acquisitionCost: vehicle.acquisitionCost,
      region: vehicle.region || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: VehicleFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, data);
        toast({
          title: "Success",
          description: "Vehicle updated successfully.",
        });
      } else {
        await api.post("/vehicles", data);
        toast({
          title: "Success",
          description: "Vehicle added to fleet.",
        });
      }
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset();
      fetchVehicles();
    } catch (error) {
      toast({
        variant: "destructive",
        title: editingId ? "Failed to update vehicle" : "Failed to add vehicle",
        description: isAxiosError(error) ? (error.response?.data?.message || error.response?.data?.error || "An error occurred.") : "An error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vehicle from the fleet?")) return;
    try {
      await api.delete(`/vehicles/${id}`);
      toast({
        title: "Deleted",
        description: "Vehicle removed from fleet.",
      });
      fetchVehicles();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete vehicle",
        description: isAxiosError(error) ? (error.response?.data?.message || error.response?.data?.error || "Could not delete vehicle.") : "Could not delete vehicle.",
      });
    }
  };

  const handleRetire = async (id: number) => {
    try {
      await api.put(`/vehicles/${id}/retire`);
      toast({
        title: "Retired",
        description: "Vehicle has been retired.",
      });
      fetchVehicles();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to retire vehicle",
        description: isAxiosError(error) ? (error.response?.data?.message || error.response?.data?.error || "Could not retire vehicle.") : "Could not retire vehicle.",
      });
    }
  };

  const getStatusBadge = (status: Vehicle["status"]) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>;
      case "IN_SHOP":
        return <Badge variant="destructive">In Shop</Badge>;
      case "ON_TRIP":
        return <Badge className="bg-blue-500 hover:bg-blue-600">On Trip</Badge>;
      case "RETIRED":
        return <Badge variant="secondary">Retired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-slate-500 mt-2">Manage your fleet and their current statuses.</p>
        </div>
        <div className="flex gap-4">
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
          <Button variant="outline" onClick={fetchVehicles} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {user?.role === "FLEET_MANAGER" && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Vehicle
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update the vehicle details." : "Enter the vehicle details to add it to the fleet."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit as any)}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="registrationNo" className="text-right">Reg. No</Label>
                    <div className="col-span-3">
                      <Input id="registrationNo" {...form.register("registrationNo")} placeholder="MH-12-AB-1234" disabled={!!editingId} />
                      {form.formState.errors.registrationNo && <p className="text-sm text-red-500 mt-1">{form.formState.errors.registrationNo.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <div className="col-span-3">
                      <Input id="name" {...form.register("name")} placeholder="Tata Ace" />
                      {form.formState.errors.name && <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Type</Label>
                    <div className="col-span-3">
                      <Select value={form.watch("type")} onValueChange={(val: any) => form.setValue("type", val)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Light Truck">Light Truck</SelectItem>
                          <SelectItem value="Medium Truck">Medium Truck</SelectItem>
                          <SelectItem value="Heavy Truck">Heavy Truck</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.type && <p className="text-sm text-red-500 mt-1">{form.formState.errors.type.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="capacity" className="text-right">Capacity (kg)</Label>
                    <div className="col-span-3">
                      <Input id="capacity" type="number" {...form.register("capacity")} placeholder="1000" />
                      {form.formState.errors.capacity && <p className="text-sm text-red-500 mt-1">{form.formState.errors.capacity.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="odometer" className="text-right">Odometer</Label>
                    <div className="col-span-3">
                      <Input id="odometer" type="number" {...form.register("odometer")} placeholder="0" />
                      {form.formState.errors.odometer && <p className="text-sm text-red-500 mt-1">{form.formState.errors.odometer.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cost" className="text-right">Cost (₹)</Label>
                    <div className="col-span-3">
                      <Input id="cost" type="number" {...form.register("acquisitionCost")} placeholder="500000" disabled={!!editingId} />
                      {form.formState.errors.acquisitionCost && <p className="text-sm text-red-500 mt-1">{form.formState.errors.acquisitionCost.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="region" className="text-right">Region</Label>
                    <div className="col-span-3">
                      <Select value={form.watch("region")} onValueChange={(val: any) => form.setValue("region", val)}>
                        <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="North">North</SelectItem>
                          <SelectItem value="South">South</SelectItem>
                          <SelectItem value="East">East</SelectItem>
                          <SelectItem value="West">West</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : editingId ? "Save Changes" : "Save Vehicle"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      <motion.div 
        className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Registration No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Odometer</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No vehicles found.
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.registrationNo}</TableCell>
                  <TableCell>{vehicle.name}</TableCell>
                  <TableCell>{vehicle.type}</TableCell>
                  <TableCell>{vehicle.capacity.toLocaleString()}</TableCell>
                  <TableCell>{vehicle.odometer.toLocaleString()}</TableCell>
                  <TableCell>{vehicle.region || "-"}</TableCell>
                  <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                  <TableCell>
                    {user?.role === "FLEET_MANAGER" && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)} title="Edit vehicle" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {vehicle.status !== "RETIRED" && vehicle.status !== "ON_TRIP" && (
                          <Button variant="ghost" size="icon" onClick={() => handleRetire(vehicle.id)} title="Retire vehicle" className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(vehicle.id)} title="Delete vehicle" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
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
      </motion.div>
    </div>
  );
}
