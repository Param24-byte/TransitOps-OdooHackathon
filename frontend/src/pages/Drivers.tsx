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
import { RefreshCw, UserPlus } from "lucide-react";
import { useToast } from "../hooks/use-toast";

interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  contactNumber: string;
  safetyScore: number;
  status: "AVAILABLE" | "ON_TRIP" | "OFF_DUTY";
}

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    licenseNumber: "",
    licenseCategory: "HMV",
    contactNumber: "",
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
  }, []);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/drivers", formData);
      toast({
        title: "Success",
        description: "Driver added successfully.",
      });
      setIsDialogOpen(false);
      setFormData({ name: "", licenseNumber: "", licenseCategory: "HMV", contactNumber: "" });
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

  const getStatusBadge = (status: Driver["status"]) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>;
      case "ON_TRIP":
        return <Badge className="bg-blue-500 hover:bg-blue-600">On Trip</Badge>;
      case "OFF_DUTY":
        return <Badge variant="secondary">Off Duty</Badge>;
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
              <form onSubmit={handleAddDriver}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="license" className="text-right">License</Label>
                    <Input id="license" value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Category</Label>
                    <div className="col-span-3">
                      <Select value={formData.licenseCategory} onValueChange={(val) => setFormData({ ...formData, licenseCategory: val })}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LMV">LMV (Light Motor Vehicle)</SelectItem>
                          <SelectItem value="HMV">HMV (Heavy Motor Vehicle)</SelectItem>
                          <SelectItem value="MCWG">MCWG (Motorcycle with Gear)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contact" className="text-right">Contact</Label>
                    <Input id="contact" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} className="col-span-3" required />
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading drivers...
                </TableCell>
              </TableRow>
            ) : drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
