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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { CheckCircle2, XCircle, MapPin, RefreshCw, Navigation, MoreHorizontal } from "lucide-react";
import { isAxiosError } from "axios";
import { useToast } from "../hooks/use-toast";
import socket from "../lib/socket";
import { Skeleton } from "../components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../contexts/AuthContext";


interface Trip {
  id: number;
  source: string;
  destination: string;
  cargoWeight: number;
  plannedDistance: number;
  status: "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
  vehicle: {
    registrationNo: string;
    name: string;
  };
  driver: {
    name: string;
  };
}

const tripSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  source: z.string().min(3, "Source must be at least 3 characters"),
  destination: z.string().min(3, "Destination must be at least 3 characters"),
  cargoWeight: z.number({ message: "Cargo weight must be a valid number" }).min(1, "Cargo weight must be positive"),
  plannedDistance: z.number({ message: "Distance must be a valid number" }).min(1, "Distance must be positive"),
});

type TripFormValues = z.infer<typeof tripSchema>;

export default function Trips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [completeTripId, setCompleteTripId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data for form selects
  const [availableVehicles, setAvailableVehicles] = useState<{id: number, registrationNo: string}[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<{id: number, name: string}[]>([]);
  
  const { toast } = useToast();

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      vehicleId: "",
      driverId: "",
      source: "",
      destination: "",
      cargoWeight: 0,
      plannedDistance: 0,
    },
  });

  const completeForm = useForm({
    defaultValues: {
      actualDistance: 0,
      revenue: 0,
    }
  });

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const response = await api.get("/trips");
      setTrips(response.data.data);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error fetching trips",
        description: "Could not load the trips list.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        api.get("/vehicles"),
        api.get("/drivers")
      ]);
      setAvailableVehicles(vehiclesRes.data.data.filter((v: any) => v.status === "AVAILABLE"));
      setAvailableDrivers(driversRes.data.data.filter((d: any) => d.status === "AVAILABLE"));
    } catch (error) {
      console.error(error);
      console.error("Failed to load options");
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchFormOptions();

    // Listen for real-time trip updates
    socket.on("tripUpdated", (data) => {
      console.log("Real-time trip update received:", data);
      fetchTrips();
      fetchFormOptions(); // Refresh available vehicles/drivers
      toast({
        title: "Live Update",
        description: `A trip was recently ${data.action}d.`,
      });
    });

    return () => {
      socket.off("tripUpdated");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: TripFormValues) => {
    setIsSubmitting(true);
    try {
      await api.post("/trips", {
        vehicleId: Number(data.vehicleId),
        driverId: Number(data.driverId),
        source: data.source,
        destination: data.destination,
        cargoWeight: Number(data.cargoWeight),
        plannedDistance: Number(data.plannedDistance),
      });
      toast({
        title: "Success",
        description: "Trip created successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
      fetchTrips();
      fetchFormOptions(); // Refresh options as vehicle/driver are now taken
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create trip",
        description: isAxiosError(error) ? (error.response?.data?.message || error.response?.data?.error || "Could not create trip.") : "Could not create trip.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, action: "dispatch" | "complete" | "cancel") => {
    try {
      await api.patch(`/trips/${id}/${action}`);
      toast({
        title: "Trip Updated",
        description: `Trip successfully ${action}ed.`,
      });
      fetchTrips();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: isAxiosError(error) ? (error.response?.data?.message || error.response?.data?.error || "Could not update trip status.") : "Could not update trip status.",
      });
    }
  };

  const handleCompleteTrip = async (data: { actualDistance: number, revenue: number }) => {
    if (!completeTripId) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/trips/${completeTripId}/complete`, data);
      toast({
        title: "Trip Updated",
        description: "Trip successfully completed.",
      });
      setCompleteTripId(null);
      completeForm.reset();
      fetchTrips();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create trip",
        description: isAxiosError(error) ? (error.response?.data?.message || error.response?.data?.error || "Could not create trip.") : "Could not create trip.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: Trip["status"]) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "DISPATCHED":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Dispatched</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
          <p className="text-slate-500 mt-2">Manage dispatch operations and monitor trip progress.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={fetchTrips} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {(user?.role === "FLEET_MANAGER" || user?.role === "DRIVER") && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <MapPin className="mr-2 h-4 w-4" /> Create Trip
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Trip</DialogTitle>
                <DialogDescription>
                  Draft a new trip and assign a vehicle and driver.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="source" className="text-right">Source</Label>
                    <div className="col-span-3">
                      <Input id="source" {...form.register("source")} placeholder="Mumbai" />
                      {form.formState.errors.source && <p className="text-sm text-red-500 mt-1">{form.formState.errors.source.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="destination" className="text-right">Destination</Label>
                    <div className="col-span-3">
                      <Input id="destination" {...form.register("destination")} placeholder="Delhi" />
                      {form.formState.errors.destination && <p className="text-sm text-red-500 mt-1">{form.formState.errors.destination.message}</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="vehicle" className="text-right">Vehicle</Label>
                    <div className="col-span-3">
                      <Select value={form.watch("vehicleId")} onValueChange={(val: any) => form.setValue("vehicleId", val)}>
                        <SelectTrigger><SelectValue placeholder="Select available vehicle" /></SelectTrigger>
                        <SelectContent>
                          {availableVehicles.map(v => (
                            <SelectItem key={v.id} value={v.id.toString()}>{v.registrationNo}</SelectItem>
                          ))}
                          {availableVehicles.length === 0 && <SelectItem value="none" disabled>No vehicles available</SelectItem>}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.vehicleId && <p className="text-sm text-red-500 mt-1">{form.formState.errors.vehicleId.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="driver" className="text-right">Driver</Label>
                    <div className="col-span-3">
                      <Select value={form.watch("driverId")} onValueChange={(val: any) => form.setValue("driverId", val)}>
                        <SelectTrigger><SelectValue placeholder="Select available driver" /></SelectTrigger>
                        <SelectContent>
                          {availableDrivers.map(d => (
                            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                          ))}
                          {availableDrivers.length === 0 && <SelectItem value="none" disabled>No drivers available</SelectItem>}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.driverId && <p className="text-sm text-red-500 mt-1">{form.formState.errors.driverId.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cargo" className="text-right">Cargo (kg)</Label>
                    <div className="col-span-3">
                      <Input id="cargo" type="number" {...form.register("cargoWeight", { valueAsNumber: true })} placeholder="5000" />
                      {form.formState.errors.cargoWeight && <p className="text-sm text-red-500 mt-1">{form.formState.errors.cargoWeight.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="distance" className="text-right">Distance (km)</Label>
                    <div className="col-span-3">
                      <Input id="distance" type="number" {...form.register("plannedDistance", { valueAsNumber: true })} placeholder="1200" />
                      {form.formState.errors.plannedDistance && <p className="text-sm text-red-500 mt-1">{form.formState.errors.plannedDistance.message}</p>}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Create Draft"}
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
              <TableHead>Route</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Cargo (kg)</TableHead>
              <TableHead>Distance (km)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                </TableRow>
              ))
            ) : trips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No trips found.
                </TableCell>
              </TableRow>
            ) : (
              trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>
                    <div className="font-medium">{trip.source}</div>
                    <div className="text-sm text-slate-500">→ {trip.destination}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{trip.vehicle.registrationNo}</div>
                    <div className="text-sm text-slate-500">{trip.vehicle.name}</div>
                  </TableCell>
                  <TableCell>{trip.driver.name}</TableCell>
                  <TableCell>{trip.cargoWeight}</TableCell>
                  <TableCell>{trip.plannedDistance}</TableCell>
                  <TableCell>{getStatusBadge(trip.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {(user?.role === "FLEET_MANAGER" || user?.role === "DRIVER") && trip.status === "DRAFT" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(trip.id, "dispatch")}>
                            <Navigation className="mr-2 h-4 w-4" />
                            Dispatch Trip
                          </DropdownMenuItem>
                        )}
                        
                        
                        {(user?.role === "FLEET_MANAGER" || user?.role === "DRIVER") && trip.status === "DISPATCHED" && (
                          <DropdownMenuItem onClick={() => setCompleteTripId(trip.id)}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark Completed
                          </DropdownMenuItem>
                        )}
                        
                        {(user?.role === "FLEET_MANAGER" || user?.role === "DRIVER") && trip.status === "DISPATCHED" && (
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm("Are you sure you want to cancel this trip?")) {
                                handleStatusChange(trip.id, "cancel");
                              }
                            }}
                            className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Trip
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Complete Trip Dialog */}
      <Dialog open={completeTripId !== null} onOpenChange={(open) => !open && setCompleteTripId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Trip</DialogTitle>
            <DialogDescription>
              Enter the final metrics for this trip to mark it as completed.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={completeForm.handleSubmit(handleCompleteTrip)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="actualDistance" className="text-right">Actual Dist. (km)</Label>
                <div className="col-span-3">
                  <Input id="actualDistance" type="number" {...completeForm.register("actualDistance", { valueAsNumber: true })} />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="revenue" className="text-right">Revenue (₹)</Label>
                <div className="col-span-3">
                  <Input id="revenue" type="number" {...completeForm.register("revenue", { valueAsNumber: true })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCompleteTripId(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Complete Trip"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
