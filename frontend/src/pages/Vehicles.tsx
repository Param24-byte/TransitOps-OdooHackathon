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
import { RefreshCw, Plus } from "lucide-react";
import { useToast } from "../hooks/use-toast";

interface Vehicle {
  id: number;
  registrationNo: string;
  name: string;
  type: string;
  capacity: number;
  odometer: number;
  status: "AVAILABLE" | "IN_SHOP" | "ON_TRIP" | "RETIRED";
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    registrationNo: "",
    name: "",
    type: "Light Truck",
    capacity: "",
    odometer: "",
    acquisitionCost: "",
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await api.get("/vehicles");
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
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/vehicles", {
        ...formData,
        capacity: Number(formData.capacity),
        odometer: Number(formData.odometer),
        acquisitionCost: Number(formData.acquisitionCost),
      });
      toast({
        title: "Success",
        description: "Vehicle added to fleet.",
      });
      setIsDialogOpen(false);
      setFormData({ registrationNo: "", name: "", type: "Light Truck", capacity: "", odometer: "", acquisitionCost: "" });
      fetchVehicles();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to add vehicle",
        description: error.response?.data?.error || "An error occurred.",
      });
    } finally {
      setIsSubmitting(false);
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
          <Button variant="outline" onClick={fetchVehicles} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Vehicle</DialogTitle>
                <DialogDescription>
                  Enter the vehicle details to add it to the fleet.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddVehicle}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="registrationNo" className="text-right">Reg. No</Label>
                    <Input id="registrationNo" value={formData.registrationNo} onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Type</Label>
                    <div className="col-span-3">
                      <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Light Truck">Light Truck</SelectItem>
                          <SelectItem value="Medium Truck">Medium Truck</SelectItem>
                          <SelectItem value="Heavy Truck">Heavy Truck</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="capacity" className="text-right">Capacity</Label>
                    <Input id="capacity" type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="col-span-3" required min="1" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="odometer" className="text-right">Odometer</Label>
                    <Input id="odometer" type="number" value={formData.odometer} onChange={(e) => setFormData({ ...formData, odometer: e.target.value })} className="col-span-3" required min="0" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cost" className="text-right">Cost</Label>
                    <Input id="cost" type="number" value={formData.acquisitionCost} onChange={(e) => setFormData({ ...formData, acquisitionCost: e.target.value })} className="col-span-3" required min="0" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Vehicle"}
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
              <TableHead>Registration No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Capacity (kg)</TableHead>
              <TableHead>Odometer (km)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading vehicles...
                </TableCell>
              </TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
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
                  <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
