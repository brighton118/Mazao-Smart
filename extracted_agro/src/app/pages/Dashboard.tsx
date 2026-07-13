import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Droplets, Thermometer, Wind, Cloud, TrendingUp, AlertTriangle } from "lucide-react";

export function Dashboard() {
  // Mock data for charts
  const soilMoistureData = [
    { time: "6:00", value: 45 },
    { time: "9:00", value: 42 },
    { time: "12:00", value: 38 },
    { time: "15:00", value: 35 },
    { time: "18:00", value: 32 },
    { time: "21:00", value: 30 },
  ];

  const temperatureHumidityData = [
    { time: "6:00", temp: 18, humidity: 75 },
    { time: "9:00", temp: 22, humidity: 68 },
    { time: "12:00", temp: 28, humidity: 55 },
    { time: "15:00", temp: 32, humidity: 48 },
    { time: "18:00", temp: 26, humidity: 60 },
    { time: "21:00", temp: 20, humidity: 70 },
  ];

  const stats = [
    {
      title: "Soil Moisture",
      value: "30%",
      status: "Low",
      icon: Droplets,
      color: "text-red-600",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      trend: "-8%",
      trendDown: true,
    },
    {
      title: "Temperature",
      value: "28°C",
      status: "Normal",
      icon: Thermometer,
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      trend: "+2°C",
      trendDown: false,
    },
    {
      title: "Humidity",
      value: "65%",
      status: "Normal",
      icon: Wind,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: "+5%",
      trendDown: false,
    },
    {
      title: "Weather",
      value: "Sunny",
      status: "Clear Sky",
      icon: Cloud,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      trend: "25°C",
      trendDown: false,
    },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your farm overview.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Last updated: Today, 10:30 AM</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <div className={`text-sm font-medium ${stat.color}`}>{stat.status}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className={`flex items-center text-sm ${stat.trendDown ? 'text-red-600' : 'text-green-600'}`}>
                    <TrendingUp className={`w-4 h-4 mr-1 ${stat.trendDown ? 'rotate-180' : ''}`} />
                    <span>{stat.trend} from yesterday</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alert Banner */}
      <Card className="border-l-4 border-l-red-500 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900">Irrigation Needed</h4>
              <p className="text-sm text-red-800 mt-1">
                Soil moisture level is below optimal threshold (30%). Consider irrigating within the next 6 hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soil Moisture Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Soil Moisture Trend</CardTitle>
            <p className="text-sm text-gray-600">Last 24 hours</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={soilMoistureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Moisture %"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ fill: "#16a34a", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Temperature & Humidity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Temperature & Humidity</CardTitle>
            <p className="text-sm text-gray-600">Last 24 hours</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={temperatureHumidityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="temp" name="Temperature (°C)" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                <Bar dataKey="humidity" name="Humidity (%)" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Farm Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Farm Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1669830239215-4dca77c47f82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyYWwlMjBmaWVsZCUyMGFlcmlhbCUyMHZpZXd8ZW58MXx8fHwxNzc1NzEwNzQ0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Farm Aerial View"
                className="w-full h-64 object-cover"
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Area</p>
                <p className="text-xl font-semibold text-gray-900">25 Hectares</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Sensors</p>
                <p className="text-xl font-semibold text-gray-900">12 Units</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Crop Type</p>
                <p className="text-xl font-semibold text-gray-900">Wheat</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full p-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-left">
              <div className="font-semibold">Start Irrigation</div>
              <div className="text-sm opacity-90">Activate water system</div>
            </button>
            <button className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-left">
              <div className="font-semibold">View Weather Forecast</div>
              <div className="text-sm opacity-90">7-day prediction</div>
            </button>
            <button className="w-full p-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-left">
              <div className="font-semibold">Generate Report</div>
              <div className="text-sm opacity-90">Export farm data</div>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
