import { StandupData } from "@/types/standupTask";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Activity, AlertCircle, CheckCircle2, Clock, Rocket } from "lucide-react";

interface DashboardStatsProps {
    data: StandupData;
}

export const DashboardStats = ({ data }: DashboardStatsProps) => {
    const { planning, devQa, prod, release } = data;

    const stats = {
        planning: planning.filter((t) => t.status !== "Complete" && t.status !== "Removed").length,
        devQa: devQa.filter((t) => t.status !== "Complete" && t.status !== "Released To Prod" && t.status !== "Removed").length,
        prodIssues: prod.filter((t) => t.status !== "Complete" && t.status !== "Removed").length,
        releaseFeatures: release.filter((t) => !t.status.includes("Released")).length,
        completedRelease: release.filter((t) => t.status.includes("Released")).length,
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/50 dark:border-blue-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        In Planning
                    </CardTitle>
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.planning}</div>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                        Tasks pending start
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200/50 dark:border-purple-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        Dev & QA Active
                    </CardTitle>
                    <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.devQa}</div>
                    <p className="text-xs text-purple-600/80 dark:text-purple-400/80">
                        Tasks in progress
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10 border-red-200/50 dark:border-red-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                        PROD Issues
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.prodIssues}</div>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80">
                        Open production issues
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200/50 dark:border-green-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                        Release Progress
                    </CardTitle>
                    <Rocket className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {stats.completedRelease} <span className="text-sm font-normal text-muted-foreground">/ {stats.releaseFeatures + stats.completedRelease}</span>
                    </div>
                    <p className="text-xs text-green-600/80 dark:text-green-400/80">
                        Features released
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
