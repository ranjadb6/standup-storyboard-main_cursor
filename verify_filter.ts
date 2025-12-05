import { CommonTask, RwtTask, ReleaseTask } from "./src/types/standupTask";

const commonTasks: CommonTask[] = [
    { id: "1", status: "Complete", taskName: "Task 1" } as CommonTask,
    { id: "2", status: "Dev Complete", taskName: "Task 2" } as CommonTask,
    { id: "3", status: "QA Complete", taskName: "Task 3" } as CommonTask,
    { id: "4", status: "Released To Prod", taskName: "Task 4" } as CommonTask,
    { id: "5", status: "In Solutioning", taskName: "Task 5" } as CommonTask,
];

const filteredCommon = commonTasks.filter(
    (task) => {
        const status = task.status.trim();
        return (
            status !== "Complete" &&
            status !== "Scrapped" &&
            status !== "Removed"
        );
    }
);

console.log("Common Tasks Filtered:");
filteredCommon.forEach(t => console.log(`${t.taskName}: ${t.status}`));

const releaseTasks: ReleaseTask[] = [
    { id: "1", status: ["Released"], item: "Item 1" } as unknown as ReleaseTask,
    { id: "2", status: ["Ready For Release"], item: "Item 2" } as unknown as ReleaseTask,
];

const filteredRelease = releaseTasks.filter((task) => !task.status.includes("Released"));

console.log("\nRelease Tasks Filtered:");
filteredRelease.forEach(t => console.log(`${t.item}: ${t.status}`));

const rwtTasks: RwtTask[] = [
    { id: "1", status: "RWT Completed", feature: "Feature 1" } as RwtTask,
    { id: "2", status: "RWT Pending", feature: "Feature 2" } as RwtTask,
];

const filteredRwt = rwtTasks.filter((task) => task.status !== "RWT Completed");

console.log("\nRwt Tasks Filtered:");
filteredRwt.forEach(t => console.log(`${t.feature}: ${t.status}`));
