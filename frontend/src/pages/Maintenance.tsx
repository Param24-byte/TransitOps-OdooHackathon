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
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { Skeleton } from "../components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../contexts/AuthContext";


interface Maintenance {
  id: number;
  date: string;
  description: string;
  cost: number;
  status: "ACTIVE" | "CLOSED";
  vehicle: { registrationNo: string; name: string; status: string };
}

const maintenanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  cost: z.number({ message: "Cost must be a valid number" }).min(0, "Cost cannot be negative"),
  vehicleId: z.string().min(1, "Vehicle is required"),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

export default function Maintenance() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Maintenance[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<{id: number, registrationNo: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: "",
      cost: 0,
      vehicleId: "",
    },
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/maintenance");
      setLogs(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching maintenance logs",
        description: "Could not load the data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get("/vehicles");
      setAvailableVehicles(response.data.data);
    } catch (error) {
      console.error("Failed to load vehicles for maintenance form");
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchVehicles();
  }, []);

  const onSubmit = async (data: MaintenanceFormValues) => {
    setIsSubmitting(true);
    try {
      await api.post("/maintenance", {
        ...data,
        vehicleId: Number(data.vehicleId),
      });
      toast({
        title: "Success",
        description: "Maintenance log added.",
      });
      setIsDialogOpen(false);
      form.reset({
        date: new Date().toISOString().split('T')[0],
        description: "",
        cost: 0,
        vehicleId: "",
      });
      fetchLogs();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to add log",
        description: error.response?.data?.error || "An error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async (id: number) => {
    try {
      await api.patch(`/maintenance/${id}/close`);
      toast({
        title: "Closed",
        description: "Maintenance log closed. Vehicle is now available.",
      });
      fetchLogs();
      fetchVehicles(); // update vehicle lists
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to close log",
        description: error.response?.data?.message || "An error occurred.",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this log?")) return;
    
    try {
      await api.delete(`/maintenance/${id}`);
      toast({
        title: "Deleted",
        description: "Maintenance log removed.",
      });
      fetchLogs();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete log",
        description: error.response?.data?.error || "An error occurred.",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Maintenance</h1>
          <p className="text-slate-500 dark:text-slate-400">Track vehicle repairs and shop logs.</p>
        </div>

        {user?.role === "FLEET_MANAGER" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Log
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
              <DialogTitle>Add Maintenance Log</DialogTitle>
              <DialogDescription>
                Record a new repair or service event.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Date</Label>
                  <div className="col-span-3">
                    <Input id="date" type="date" {...form.register("date")} />
                    {form.formState.errors.date && <p className="text-sm text-red-500 mt-1">{form.formState.errors.date.message}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vehicle" className="text-right">Vehicle</Label>
                  <div className="col-span-3">
                    <Select value={form.watch("vehicleId")} onValueChange={(val: any) => form.setValue("vehicleId", val)}>
                      <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                      <SelectContent>
                        {availableVehicles.map(v => (
                          <SelectItem key={v.id} value={v.id.toString()}>{v.registrationNo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.vehicleId && <p className="text-sm text-red-500 mt-1">{form.formState.errors.vehicleId.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <div className="col-span-3">
                    <Input id="description" {...form.register("description")} placeholder="Oil change" />
                    {form.formState.errors.description && <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cost" className="text-right">Cost (₹)</Label>
                  <div className="col-span-3">
                    <Input id="cost" type="number" step="any" {...form.register("cost", { valueAsNumber: true })} placeholder="1500" />
                    {form.formState.errors.cost && <p className="text-sm text-red-500 mt-1">{form.formState.errors.cost.message}</p>}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Log"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Cost (₹)</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No maintenance records found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{new Date(log.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {log.vehicle.registrationNo}
                    {log.vehicle.status === "IN_SHOP" && (
                      <Badge variant="destructive" className="ml-2 text-[10px]">IN SHOP</Badge>
                    )}
                  </TableCell>
                  <TableCell>{log.description}</TableCell>
                  <TableCell className="text-right">₹{log.cost.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {user?.role === "FLEET_MANAGER" && log.status === "ACTIVE" && (
                      <Button variant="outline" size="sm" onClick={() => handleClose(log.id)} className="mr-2 h-8 text-xs">
                        Close
                      </Button>
                    )}
                    {user?.role === "FLEET_MANAGER" && log.status === "CLOSED" && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(log.id)} title="Delete log" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
