import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Droplets,
  Bug,
  Cloud,
  Thermometer,
  Sprout,
  TrendingUp,
  X,
} from "lucide-react";

type AlertStatus = "critical" | "warning" | "normal";

interface Alert {
  id: string;
  title: string;
  message: string;
  status: AlertStatus;
  icon: any;
  time: string;
  recommendation?: string;
}

export function Alerts() {
  const alerts: Alert[] = [
    {
      id: "1",
      title: "Irrigation Needed",
      message: "Soil moisture level has dropped to 30% in Field A. Immediate irrigation recommended.",
      status: "critical",
      icon: Droplets,
      time: "10 minutes ago",
      recommendation: "Start irrigation system for 2-3 hours to restore optimal moisture levels (45-50%).",
    },
    {
      id: "2",
      title: "Pest Risk Detected",
      message: "Temperature and humidity conditions favorable for aphid infestation in next 48 hours.",
      status: "warning",
      icon: Bug,
      time: "1 hour ago",
      recommendation: "Consider applying organic pest control measures. Inspect crops for early signs.",
    },
    {
      id: "3",
      title: "Rain Forecast",
      message: "Heavy rainfall expected in 24 hours. Precipitation: 25-35mm.",
      status: "warning",
      icon: Cloud,
      time: "2 hours ago",
      recommendation: "Delay irrigation schedule. Ensure drainage systems are clear.",
    },
    {
      id: "4",
      title: "Temperature Alert",
      message: "High temperature expected tomorrow. Maximum: 38°C.",
      status: "warning",
      icon: Thermometer,
      time: "3 hours ago",
      recommendation: "Increase irrigation frequency. Consider shade covers for sensitive crops.",
    },
    {
      id: "5",
      title: "Optimal Growth Conditions",
      message: "Field B showing excellent growth parameters. All metrics within optimal range.",
      status: "normal",
      icon: Sprout,
      time: "5 hours ago",
      recommendation: "Maintain current irrigation and fertilization schedule.",
    },
    {
      id: "6",
      title: "Yield Prediction Update",
      message: "AI model predicts 12% increase in yield compared to last season.",
      status: "normal",
      icon: TrendingUp,
      time: "1 day ago",
      recommendation: "Current farming practices are highly effective. Continue monitoring.",
    },
  ];

  const getAlertStyles = (status: AlertStatus) => {
    switch (status) {
      case "critical":
        return {
          bgColor: "bg-red-50 border-red-200",
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          badgeVariant: "destructive" as const,
          badge: "Critical",
        };
      case "warning":
        return {
          bgColor: "bg-yellow-50 border-yellow-200",
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          badgeVariant: "outline" as const,
          badge: "Warning",
        };
      case "normal":
        return {
          bgColor: "bg-green-50 border-green-200",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          badgeVariant: "secondary" as const,
          badge: "Normal",
        };
    }
  };

  const getStatusIcon = (status: AlertStatus) => {
    switch (status) {
      case "critical":
        return <AlertTriangle className="w-5 h-5" />;
      case "warning":
        return <AlertCircle className="w-5 h-5" />;
      case "normal":
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Alerts & Recommendations</h1>
        <p className="text-gray-600 mt-1">Monitor critical updates and AI-powered recommendations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Critical Alerts</p>
                <p className="text-3xl font-bold text-red-900">1</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Warnings</p>
                <p className="text-3xl font-bold text-yellow-900">3</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">All Good</p>
                <p className="text-3xl font-bold text-green-900">2</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => {
          const styles = getAlertStyles(alert.status);
          const Icon = alert.icon;

          return (
            <Card key={alert.id} className={`${styles.bgColor} border-2`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className={`${styles.iconBg} rounded-lg p-3 flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${styles.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                        <Badge variant={styles.badgeVariant} className="flex items-center gap-1">
                          {getStatusIcon(alert.status)}
                          {styles.badge}
                        </Badge>
                      </div>

                      <p className="text-gray-700 mb-2">{alert.message}</p>

                      {alert.recommendation && (
                        <div className="mt-3 p-3 bg-white/50 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            AI Recommendation:
                          </p>
                          <p className="text-sm text-gray-700">{alert.recommendation}</p>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-3">{alert.time}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="ghost" size="sm">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State for when there are no alerts (commented out for demo) */}
      {/* <Card className="p-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h3>
        <p className="text-gray-600">No active alerts at the moment. Your farm is in good condition.</p>
      </Card> */}
    </div>
  );
}
