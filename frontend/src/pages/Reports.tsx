import { useEffect, useState } from "react";
import api from "../lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function Reports() {
  const [fuelEfficiency, setFuelEfficiency] = useState<any[]>([]);
  const [operationalCosts, setOperationalCosts] = useState<any[]>([]);
  const [vehicleROI, setVehicleROI] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [fuelRes, costRes, roiRes] = await Promise.all([
          api.get("/reports/fuel-efficiency"),
          api.get("/reports/operational-costs"),
          api.get("/reports/vehicle-roi"),
        ]);
        
        setFuelEfficiency(fuelRes.data.data);
        setOperationalCosts(costRes.data.data);
        setVehicleROI(roiRes.data.data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching reports",
          description: "Could not load the reports data.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [toast]);

  const downloadCSV = (type: string) => {
    // We can download directly via window.location or fetch
    // Since it requires authentication, fetch is better if we have token,
    // But we are using cookies so window.open or a simple anchor tag works too.
    // However, our API has CORS and credentials. A direct fetch to blob is robust.
    api.get(`/reports/export.csv?type=${type}`, { responseType: 'blob' })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type}-report.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Export Failed",
          description: "Could not download the CSV report.",
        });
      });
  };

  if (loading) {
    return <div className="p-8">Loading reports data...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-slate-500 mt-2">Comprehensive data on fleet efficiency and costs.</p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Fuel Efficiency</CardTitle>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('fuel-efficiency')}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Distance (km)</TableHead>
                  <TableHead className="text-right">Fuel (L)</TableHead>
                  <TableHead className="text-right">Efficiency (km/L)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelEfficiency.map(item => (
                  <TableRow key={item.vehicleId}>
                    <TableCell>
                      <div className="font-medium">{item.registrationNo}</div>
                      <div className="text-sm text-slate-500">{item.name}</div>
                    </TableCell>
                    <TableCell className="text-right">{item.totalDistance.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.totalFuel.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium text-blue-600 dark:text-blue-400">{item.efficiency}</TableCell>
                  </TableRow>
                ))}
                {fuelEfficiency.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">No data available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Operational Costs</CardTitle>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('operational-costs')}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Fuel (₹)</TableHead>
                  <TableHead className="text-right">Maintenance (₹)</TableHead>
                  <TableHead className="text-right">Other Expenses (₹)</TableHead>
                  <TableHead className="text-right">Total Cost (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operationalCosts.map(item => (
                  <TableRow key={item.vehicleId}>
                    <TableCell>
                      <div className="font-medium">{item.registrationNo}</div>
                      <div className="text-sm text-slate-500">{item.name}</div>
                    </TableCell>
                    <TableCell className="text-right">{item.fuelCost.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.maintenanceCost.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.expensesCost.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium text-red-600 dark:text-red-400">{item.totalCost.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {operationalCosts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">No data available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Vehicle ROI</CardTitle>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('vehicle-roi')}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Revenue (₹)</TableHead>
                  <TableHead className="text-right">Total Cost (₹)</TableHead>
                  <TableHead className="text-right">Profit (₹)</TableHead>
                  <TableHead className="text-right">Acquisition (₹)</TableHead>
                  <TableHead className="text-right">ROI (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleROI.map(item => (
                  <TableRow key={item.vehicleId}>
                    <TableCell>
                      <div className="font-medium">{item.registrationNo}</div>
                      <div className="text-sm text-slate-500">{item.name}</div>
                    </TableCell>
                    <TableCell className="text-right">{item.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.totalCost.toLocaleString()}</TableCell>
                    <TableCell className={`text-right font-medium ${item.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {item.profit.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{item.acquisitionCost.toLocaleString()}</TableCell>
                    <TableCell className={`text-right font-bold ${item.roiPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {item.roiPercent}%
                    </TableCell>
                  </TableRow>
                ))}
                {vehicleROI.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">No data available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
