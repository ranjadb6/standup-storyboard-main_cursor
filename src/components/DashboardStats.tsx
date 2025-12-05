import { StandupData } from "@/types/standupTask";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Activity, AlertCircle, CheckCircle2, Clock, Rocket } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardStatsProps {
    data: StandupData;
}

export const DashboardStats = ({ data }: DashboardStatsProps) => {
    const { planning, devQa, prod, release, rwt } = data;

    const stats = {
        planning: planning.filter((t) => t.status !== "Complete" && t.status !== "Removed").length,
        devQa: devQa.filter((t) => t.status !== "Complete" && t.status !== "Released To Prod" && t.status !== "Removed").length,
        prodIssues: prod.filter((t) => t.status !== "Complete" && t.status !== "Removed").length,
        releaseFeatures: release.filter((t) => !t.status.includes("Released")).length,
        completedRelease: release.filter((t) => t.status.includes("Released")).length,
        rwtPending: rwt ? rwt.filter((t) => t.status === "RWT Pending").length : 0,
        rwtTotal: rwt ? rwt.length : 0,
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
        >
            <motion.div variants={item}>
                <Card className="relative overflow-hidden border-0 bg-blue-500/10 backdrop-blur-md shadow-lg hover:shadow-blue-500/20 hover:scale-105 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            In Planning
                        </CardTitle>
                        <div className="p-2 bg-blue-500/20 rounded-full">
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">{stats.planning}</div>
                        <p className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
                            Tasks pending start
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={item}>
                <Card className="relative overflow-hidden border-0 bg-purple-500/10 backdrop-blur-md shadow-lg hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            Dev & QA Active
                        </CardTitle>
                        <div className="p-2 bg-purple-500/20 rounded-full">
                            <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">{stats.devQa}</div>
                        <p className="text-xs text-purple-600/80 dark:text-purple-400/80 font-medium">
                            Tasks in progress
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={item}>
                <Card className="relative overflow-hidden border-0 bg-red-500/10 backdrop-blur-md shadow-lg hover:shadow-red-500/20 hover:scale-105 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                            PROD Issues
                        </CardTitle>
                        <div className="p-2 bg-red-500/20 rounded-full">
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold text-red-900 dark:text-red-100 mb-1">{stats.prodIssues}</div>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80 font-medium">
                            Open production issues
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={item}>
                <Card className="relative overflow-hidden border-0 bg-green-500/10 backdrop-blur-md shadow-lg hover:shadow-green-500/20 hover:scale-105 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                            Release Progress
                        </CardTitle>
                        <div className="p-2 bg-green-500/20 rounded-full">
                            <Rocket className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">
                            {stats.completedRelease} <span className="text-lg font-normal text-green-700/60 dark:text-green-300/60">/ {stats.releaseFeatures + stats.completedRelease}</span>
                        </div>
                        <p className="text-xs text-green-600/80 dark:text-green-400/80 font-medium">
                            Features released
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={item}>
                <Card className="relative overflow-hidden border-0 bg-orange-500/10 backdrop-blur-md shadow-lg hover:shadow-orange-500/20 hover:scale-105 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                            Planned RWT
                        </CardTitle>
                        <div className="p-2 bg-orange-500/20 rounded-full">
                            <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-1">
                            {stats.rwtPending} <span className="text-lg font-normal text-orange-700/60 dark:text-orange-300/60">/ {stats.rwtTotal}</span>
                        </div>
                        <p className="text-xs text-orange-600/80 dark:text-orange-400/80 font-medium">
                            Pending RWT tasks
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
};
