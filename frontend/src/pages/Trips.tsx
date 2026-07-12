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
import { RefreshCw, MapPin, MoreHorizontal, CheckCircle2, Navigation } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { socket } from "../lib/socket";

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

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data for form selects
  const [availableVehicles, setAvailableVehicles] = useState<{id: number, registrationNo: string}[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<{id: number, name: string}[]>([]);
  
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    vehicleId: "",
    driverId: "",
    source: "",
    destination: "",
    cargoWeight: "",
    plannedDistance: "",
  });

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const response = await api.get("/trips");
      setTrips(response.data.data);
    } catch (error) {
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
  }, []);

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/trips", {
        vehicleId: Number(formData.vehicleId),
        driverId: Number(formData.driverId),
        source: formData.source,
        destination: formData.destination,
        cargoWeight: Number(formData.cargoWeight),
        plannedDistance: Number(formData.plannedDistance),
      });
      toast({
        title: "Success",
        description: "Trip created successfully.",
      });
      setIsDialogOpen(false);
      setFormData({ vehicleId: "", driverId: "", source: "", destination: "", cargoWeight: "", plannedDistance: "" });
      fetchTrips();
      fetchFormOptions(); // Refresh options as vehicle/driver are now taken
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create trip",
        description: error.response?.data?.error || "An error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, action: "dispatch" | "complete") => {
    try {
      await api.patch(`/trips/${id}/${action}`);
      toast({
        title: "Trip Updated",
        description: `Trip successfully ${action}ed.`,
      });
      fetchTrips();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: error.response?.data?.error || "Could not update trip status.",
      });
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
              <form onSubmit={handleAddTrip}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="source" className="text-right">Source</Label>
                    <Input id="source" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="destination" className="text-right">Destination</Label>
                    <Input id="destination" value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} className="col-span-3" required />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="vehicle" className="text-right">Vehicle</Label>
                    <div className="col-span-3">
                      <Select value={formData.vehicleId} onValueChange={(val) => setFormData({ ...formData, vehicleId: val })}>
                        <SelectTrigger><SelectValue placeholder="Select available vehicle" /></SelectTrigger>
                        <SelectContent>
                          {availableVehicles.map(v => (
                            <SelectItem key={v.id} value={v.id.toString()}>{v.registrationNo}</SelectItem>
                          ))}
                          {availableVehicles.length === 0 && <SelectItem value="none" disabled>No vehicles available</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="driver" className="text-right">Driver</Label>
                    <div className="col-span-3">
                      <Select value={formData.driverId} onValueChange={(val) => setFormData({ ...formData, driverId: val })}>
                        <SelectTrigger><SelectValue placeholder="Select available driver" /></SelectTrigger>
                        <SelectContent>
                          {availableDrivers.map(d => (
                            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                          ))}
                          {availableDrivers.length === 0 && <SelectItem value="none" disabled>No drivers available</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cargo" className="text-right">Cargo (kg)</Label>
                    <Input id="cargo" type="number" value={formData.cargoWeight} onChange={(e) => setFormData({ ...formData, cargoWeight: e.target.value })} className="col-span-3" required min="1" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="distance" className="text-right">Distance (km)</Label>
                    <Input id="distance" type="number" value={formData.plannedDistance} onChange={(e) => setFormData({ ...formData, plannedDistance: e.target.value })} className="col-span-3" required min="1" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting || !formData.vehicleId || !formData.driverId}>
                    {isSubmitting ? "Saving..." : "Create Draft"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading trips...
                </TableCell>
              </TableRow>
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
                        
                        {trip.status === "DRAFT" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(trip.id, "dispatch")}>
                            <Navigation className="mr-2 h-4 w-4" />
                            Dispatch Trip
                          </DropdownMenuItem>
                        )}
                        
                        {trip.status === "DISPATCHED" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(trip.id, "complete")}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark Completed
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
    </div>
  );
}
