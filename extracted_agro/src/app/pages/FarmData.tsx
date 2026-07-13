import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Search, Download, Calendar, Filter } from "lucide-react";

interface FarmDataEntry {
  id: string;
  date: string;
  time: string;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  status: "normal" | "warning" | "critical";
}

export function FarmData() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock historical data
  const farmData: FarmDataEntry[] = [
    {
      id: "1",
      date: "Apr 09, 2026",
      time: "10:00 AM",
      soilMoisture: 30,
      temperature: 28,
      humidity: 65,
      status: "critical",
    },
    {
      id: "2",
      date: "Apr 09, 2026",
      time: "08:00 AM",
      soilMoisture: 32,
      temperature: 25,
      humidity: 68,
      status: "warning",
    },
    {
      id: "3",
      date: "Apr 09, 2026",
      time: "06:00 AM",
      soilMoisture: 35,
      temperature: 22,
      humidity: 72,
      status: "warning",
    },
    {
      id: "4",
      date: "Apr 08, 2026",
      time: "06:00 PM",
      soilMoisture: 38,
      temperature: 26,
      humidity: 70,
      status: "warning",
    },
    {
      id: "5",
      date: "Apr 08, 2026",
      time: "04:00 PM",
      soilMoisture: 40,
      temperature: 30,
      humidity: 62,
      status: "normal",
    },
    {
      id: "6",
      date: "Apr 08, 2026",
      time: "02:00 PM",
      soilMoisture: 42,
      temperature: 32,
      humidity: 58,
      status: "normal",
    },
    {
      id: "7",
      date: "Apr 08, 2026",
      time: "12:00 PM",
      soilMoisture: 44,
      temperature: 31,
      humidity: 60,
      status: "normal",
    },
    {
      id: "8",
      date: "Apr 08, 2026",
      time: "10:00 AM",
      soilMoisture: 45,
      temperature: 28,
      humidity: 65,
      status: "normal",
    },
    {
      id: "9",
      date: "Apr 08, 2026",
      time: "08:00 AM",
      soilMoisture: 46,
      temperature: 24,
      humidity: 70,
      status: "normal",
    },
    {
      id: "10",
      date: "Apr 08, 2026",
      time: "06:00 AM",
      soilMoisture: 48,
      temperature: 20,
      humidity: 75,
      status: "normal",
    },
    {
      id: "11",
      date: "Apr 07, 2026",
      time: "06:00 PM",
      soilMoisture: 47,
      temperature: 25,
      humidity: 68,
      status: "normal",
    },
    {
      id: "12",
      date: "Apr 07, 2026",
      time: "02:00 PM",
      soilMoisture: 45,
      temperature: 29,
      humidity: 62,
      status: "normal",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Warning</Badge>;
      case "normal":
        return <Badge className="bg-green-500 text-white hover:bg-green-600">Normal</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-50";
      case "warning":
        return "bg-yellow-50";
      default:
        return "";
    }
  };

  const filteredData = farmData.filter(
    (entry) =>
      entry.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.time.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Farm Data</h1>
        <p className="text-gray-600 mt-1">Historical sensor readings and analytics</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Records</p>
            <p className="text-2xl font-bold text-gray-900">{farmData.length}</p>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Avg Soil Moisture</p>
            <p className="text-2xl font-bold text-gray-900">41.5%</p>
            <p className="text-xs text-green-600 mt-1">↑ 3.2% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Avg Temperature</p>
            <p className="text-2xl font-bold text-gray-900">26.8°C</p>
            <p className="text-xs text-gray-500 mt-1">Within normal range</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Avg Humidity</p>
            <p className="text-2xl font-bold text-gray-900">66.2%</p>
            <p className="text-xs text-gray-500 mt-1">Optimal conditions</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle>Sensor Readings History</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by date or time..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Buttons */}
              <Button variant="outline" size="default">
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </Button>
              <Button variant="outline" size="default">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="default">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Soil Moisture</TableHead>
                  <TableHead>Temperature</TableHead>
                  <TableHead>Humidity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((entry) => (
                  <TableRow key={entry.id} className={getStatusColor(entry.status)}>
                    <TableCell className="font-medium">{entry.date}</TableCell>
                    <TableCell>{entry.time}</TableCell>
                    <TableCell>
                      <span className={entry.soilMoisture < 35 ? "text-red-600 font-semibold" : ""}>
                        {entry.soilMoisture}%
                      </span>
                    </TableCell>
                    <TableCell>{entry.temperature}°C</TableCell>
                    <TableCell>{entry.humidity}%</TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No records found matching your search.
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Showing {filteredData.length} of {farmData.length} records
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Download your farm data in various formats for analysis and record-keeping.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export as CSV
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export as Excel
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
