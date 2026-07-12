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
import { Plus, Trash2, Fuel } from "lucide-react";
import { isAxiosError } from "axios";
import { useToast } from "../hooks/use-toast";
import { Skeleton } from "../components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../contexts/AuthContext";


interface Expense {
  id: number;
  date: string;
  type: "FUEL" | "TOLL" | "PERMIT" | "INSURANCE" | "REPAIR" | "OTHER";
  description: string;
  amount: number;
  vehicle: { registrationNo: string; name: string; status: string };
}

const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.enum(["FUEL", "TOLL", "PERMIT", "INSURANCE", "REPAIR", "OTHER"]),
  description: z.string().min(3, "Description must be at least 3 characters"),
  amount: z.number({ message: "Amount must be a valid number" }).min(0, "Amount cannot be negative"),
  vehicleId: z.string().min(1, "Vehicle is required"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const fuelSchema = z.object({
  date: z.string().min(1, "Date is required"),
  liters: z.number({ message: "Liters must be a valid number" }).min(0, "Liters cannot be negative"),
  cost: z.number({ message: "Cost must be a valid number" }).min(0, "Cost cannot be negative"),
  vehicleId: z.string().min(1, "Vehicle is required"),
});

type FuelFormValues = z.infer<typeof fuelSchema>;

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFuelDialogOpen, setIsFuelDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFuelSubmitting, setIsFuelSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: "OTHER",
      description: "",
      amount: 0,
      vehicleId: "",
    },
  });

  const fuelForm = useForm<FuelFormValues>({
    resolver: zodResolver(fuelSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      liters: 0,
      cost: 0,
      vehicleId: "",
    },
  });

  const [availableVehicles, setAvailableVehicles] = useState<{id: number, registrationNo: string}[]>([]);

  const fetchVehicles = async () => {
    try {
      const response = await api.get("/vehicles");
      setAvailableVehicles(response.data.data);
    } catch (error) {
      console.error(error);
      console.error("Failed to load vehicles for expense form");
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await api.get("/expenses");
      setExpenses(response.data.data);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error fetching expenses",
        description: "Could not load the data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchVehicles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: ExpenseFormValues) => {
    setIsSubmitting(true);
    try {
      await api.post("/expenses", {
        ...data,
        vehicleId: Number(data.vehicleId),
      });
      toast({
        title: "Success",
        description: "Expense added.",
      });
      setIsDialogOpen(false);
      form.reset({
        date: new Date().toISOString().split('T')[0],
        type: "OTHER",
        description: "",
        amount: 0,
        vehicleId: "",
      });
      fetchExpenses();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add expense",
        description: isAxiosError(error) ? (error.response?.data?.message || error.response?.data?.error || "Could not add expense.") : "Could not add expense.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFuelSubmit = async (data: FuelFormValues) => {
    setIsFuelSubmitting(true);
    try {
      await api.post("/fuel", {
        ...data,
        vehicleId: Number(data.vehicleId),
      });
      toast({
        title: "Success",
        description: "Fuel log added.",
      });
      setIsFuelDialogOpen(false);
      fuelForm.reset({
        date: new Date().toISOString().split('T')[0],
        liters: 0,
        cost: 0,
        vehicleId: "",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add fuel log",
        description: isAxiosError(error) ? (error.response?.data?.message || error.response?.data?.error || "Could not add fuel log.") : "Could not add fuel log.",
      });
    } finally {
      setIsFuelSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    
    try {
      await api.delete(`/expenses/${id}`);
      toast({
        title: "Deleted",
        description: "Expense removed.",
      });
      fetchExpenses();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete expense",
        description: isAxiosError(error) ? (error.response?.data?.message || error.response?.data?.error || "Could not delete expense.") : "Could not delete expense.",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Expenses</h1>
          <p className="text-slate-500 dark:text-slate-400">Track company expenses and operational costs.</p>
        </div>

        {(user?.role === "FLEET_MANAGER" || user?.role === "FINANCIAL_ANALYST") && (
          <div className="flex gap-2">
            <Dialog open={isFuelDialogOpen} onOpenChange={setIsFuelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <Fuel className="mr-2 h-4 w-4" /> Log Fuel
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Log Fuel Usage</DialogTitle>
                  <DialogDescription>
                    Record fuel consumption for a vehicle.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={fuelForm.handleSubmit(onFuelSubmit)}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="fuel-date" className="text-right">Date</Label>
                      <div className="col-span-3">
                        <Input id="fuel-date" type="date" {...fuelForm.register("date")} />
                        {fuelForm.formState.errors.date && <p className="text-sm text-red-500 mt-1">{fuelForm.formState.errors.date.message}</p>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="fuel-vehicle" className="text-right">Vehicle</Label>
                      <div className="col-span-3">
                        <Select value={fuelForm.watch("vehicleId")} onValueChange={(val: any) => fuelForm.setValue("vehicleId", val)}>
                          <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                          <SelectContent>
                            {availableVehicles.map(v => (
                              <SelectItem key={v.id} value={v.id.toString()}>{v.registrationNo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fuelForm.formState.errors.vehicleId && <p className="text-sm text-red-500 mt-1">{fuelForm.formState.errors.vehicleId.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="liters" className="text-right">Liters</Label>
                      <div className="col-span-3">
                        <Input id="liters" type="number" step="any" {...fuelForm.register("liters", { valueAsNumber: true })} placeholder="40" />
                        {fuelForm.formState.errors.liters && <p className="text-sm text-red-500 mt-1">{fuelForm.formState.errors.liters.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="fuel-cost" className="text-right">Cost (₹)</Label>
                      <div className="col-span-3">
                        <Input id="fuel-cost" type="number" step="any" {...fuelForm.register("cost", { valueAsNumber: true })} placeholder="4000" />
                        {fuelForm.formState.errors.cost && <p className="text-sm text-red-500 mt-1">{fuelForm.formState.errors.cost.message}</p>}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isFuelSubmitting}>
                      {isFuelSubmitting ? "Saving..." : "Save Fuel Log"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
              </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
              <DialogDescription>
                Log a new operational expense.
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
                  <Label htmlFor="type" className="text-right">Category</Label>
                  <div className="col-span-3">
                    <Select value={form.watch("type")} onValueChange={(val: any) => form.setValue("type", val)}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FUEL">Fuel</SelectItem>
                        <SelectItem value="TOLL">Toll</SelectItem>
                        <SelectItem value="PERMIT">Permit</SelectItem>
                        <SelectItem value="INSURANCE">Insurance</SelectItem>
                        <SelectItem value="REPAIR">Repair</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.type && <p className="text-sm text-red-500 mt-1">{form.formState.errors.type.message}</p>}
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
                    <Input id="description" {...form.register("description")} placeholder="e.g. Highway Toll" />
                    {form.formState.errors.description && <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">Amount (₹)</Label>
                  <div className="col-span-3">
                    <Input id="amount" type="number" step="any" {...form.register("amount", { valueAsNumber: true })} placeholder="500" />
                    {form.formState.errors.amount && <p className="text-sm text-red-500 mt-1">{form.formState.errors.amount.message}</p>}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Expense"}
                </Button>
              </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount (₹)</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No expenses found.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>{expense.vehicle?.registrationNo || "Unknown"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{expense.type}</Badge>
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell className="text-right font-semibold">₹{expense.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    {(user?.role === "FLEET_MANAGER" || user?.role === "FINANCIAL_ANALYST") && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} title="Delete expense" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
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
