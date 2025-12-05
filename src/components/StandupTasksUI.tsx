import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CommonTask, ReleaseTask, RwtTask, StandupData, EMPTY_STANDUP_DATA } from "@/types/standupTask";
import { CommonTaskTable } from "./CommonTaskTable";
import { ReleaseTaskTable } from "./ReleaseTaskTable";
import { RwtTaskTable } from "./RwtTaskTable";
import { MeetingNotes } from "./MeetingNotes";
import { DashboardStats } from "./DashboardStats";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Download, Link2, PlugZap, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { storageService } from "@/utils/storageService";
import { postChangelogToAdo } from "@/utils/azureDevOps";
import { arrayMove } from "@dnd-kit/sortable";
import { useReactToPrint } from "react-to-print";

const extractIncrementalRemark = (previous: string, next: string) => {
  if (!next) return "";
  if (!previous) return next.trim();
  if (next === previous) return "";
  if (next.endsWith(previous)) {
    const diff = next.slice(0, next.length - previous.length);
    return diff.trim();
  }
  return next.trim();
};
import { useToast } from "@/hooks/use-toast";

export const StandupTasksUI = () => {
  const [standupData, setStandupData] = useState<StandupData>(EMPTY_STANDUP_DATA);
  const [filters, setFilters] = useState({
    planning: true,
    devQa: true,
    prod: true,
    release: true,
    rwt: true,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [fileConnection, setFileConnection] = useState<{ name: string; directory?: string } | null>(null);
  const [isConnectingFile, setIsConnectingFile] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<number>();
  const skipNextSaveRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { planning, devQa, prod, release, rwt, meetingNotes } = standupData;

  // hydrate + subscribe to external updates
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const data = await storageService.load();
      if (cancelled) return;
      skipNextSaveRef.current = true;
      setStandupData(data);
      setIsInitialized(true);
      setLastSyncedAt(new Date());
    };

    loadData();

    const unsubscribe = storageService.subscribe((data) => {
      skipNextSaveRef.current = true;
      setStandupData(data);
      setIsInitialized(true);
      setLastSyncedAt(new Date());
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // autosave on changes
  useEffect(() => {
    if (!isInitialized) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        await storageService.save(standupData);
        setLastSyncedAt(new Date());
      } catch (error) {
        console.error("Failed to auto-save data", error);
        toast({
          variant: "destructive",
          title: "Auto-save failed",
          description: "Please check console for more details.",
        });
      }
    }, 400);
  }, [standupData, isInitialized, toast]);

  const createCommonTask = (): CommonTask => ({
    id: crypto.randomUUID(),
    adoId: "",
    taskName: "",
    status: "Not Started",
    collaborators: [],
    DevStartDate: null,
    DevDueDate: null,
    QAStartDate: null,
    QAEndDate: null,
    remarks: "",
    committedDate: null,
  });



  const updateCommonTaskSection =
    (section: "planning" | "devQa" | "prod") => (id: string, updates: Partial<CommonTask>) => {
      const adoSyncPayloads: { adoId: string; remarks: string }[] = [];
      setStandupData((prev) => ({
        ...prev,
        [section]: prev[section].map((task) => {
          if (task.id !== id) return task;
          const updatedTask = { ...task, ...updates };

          if ("remarks" in updates && updates.remarks !== undefined && updatedTask.adoId) {
            const incremental = extractIncrementalRemark(task.remarks ?? "", updates.remarks ?? "");
            if (incremental) {
              adoSyncPayloads.push({ adoId: updatedTask.adoId, remarks: incremental });
            }
          }

          return updatedTask;
        }),
      }));

      if (adoSyncPayloads.length) {
        adoSyncPayloads.forEach(({ adoId, remarks }) => {
          postChangelogToAdo(adoId, remarks)
            .then(() =>
              toast({
                title: "Azure DevOps updated",
                description: `Changelog posted to ${adoId}`,
              })
            )
            .catch((error) =>
              toast({
                variant: "destructive",
                title: `Failed to update ${adoId}`,
                description: error instanceof Error ? error.message : "Unknown Azure DevOps error",
              })
            );
        });
      }
    };

  const deleteCommonTask = (section: "planning" | "devQa" | "prod") => (id: string) => {
    setStandupData((prev) => ({
      ...prev,
      [section]: prev[section].filter((task) => task.id !== id),
    }));
  };

  const addCommonTaskToSection = (section: "planning" | "devQa" | "prod") => {
    setStandupData((prev) => ({
      ...prev,
      [section]: [...prev[section], createCommonTask()],
    }));
  };

  const reorderCommonTaskSection = (section: "planning" | "devQa" | "prod") => (startIndex: number, endIndex: number) => {
    setStandupData((prev) => ({
      ...prev,
      [section]: arrayMove(prev[section], startIndex, endIndex),
    }));
  };

  const createReleaseTask = (): ReleaseTask => ({
    id: crypto.randomUUID(),
    adoId: "",
    item: "",
    status: [],
    crLink: "",
    jmdbId: "",
    services: [],
    remarks: "",
    committedDate: null,
  });

  const createRwtTask = (): RwtTask => ({
    id: crypto.randomUUID(),
    feature: "",
    status: "RWT Pending",
    collaborators: [],
    startDate: null,
    endDate: null,
    remarks: "",
  });

  const updateReleaseTask = (id: string, updates: Partial<ReleaseTask>) => {
    setStandupData((prev) => {
      const task = prev.release.find((t) => t.id === id);
      if (!task) return prev;

      const updatedTask = { ...task, ...updates };
      const adoId = updatedTask.adoId;

      if (adoId) {
        const today = new Date().toLocaleDateString("en-GB"); // DD/MM/YYYY
        let changelog = "";

        if ("crLink" in updates && updates.crLink !== task.crLink) {
          changelog = `${today} : Added CR Link : - ${updates.crLink}`;
        } else if ("jmdbId" in updates && updates.jmdbId !== task.jmdbId) {
          changelog = `${today} : Added JMDB ID : - ${updates.jmdbId}`;
        } else if ("services" in updates && JSON.stringify(updates.services) !== JSON.stringify(task.services)) {
          changelog = `${today} : Added Services : - ${updates.services?.join(", ")}`;
        }

        if (changelog) {
          postChangelogToAdo(adoId, changelog)
            .then(() =>
              toast({
                title: "Azure DevOps updated",
                description: `Changelog posted to ${adoId}`,
              })
            )
            .catch((error) =>
              toast({
                variant: "destructive",
                title: `Failed to update ${adoId}`,
                description: error instanceof Error ? error.message : "Unknown Azure DevOps error",
              })
            );
        }
      }

      return {
        ...prev,
        release: prev.release.map((t) => (t.id === id ? updatedTask : t)),
      };
    });
  };

  const deleteReleaseTask = (id: string) => {
    setStandupData((prev) => ({
      ...prev,
      release: prev.release.filter((task) => task.id !== id),
    }));
  };

  const addReleaseTask = () => {
    setStandupData((prev) => ({
      ...prev,
      release: [...prev.release, createReleaseTask()],
    }));
  };

  const reorderReleaseTask = (startIndex: number, endIndex: number) => {
    setStandupData((prev) => ({
      ...prev,
      release: arrayMove(prev.release, startIndex, endIndex),
    }));
  };

  const updateRwtTask = (id: string, updates: Partial<RwtTask>) => {
    setStandupData((prev) => ({
      ...prev,
      rwt: prev.rwt.map((task) => (task.id === id ? { ...task, ...updates } : task)),
    }));
  };

  const deleteRwtTask = (id: string) => {
    setStandupData((prev) => ({
      ...prev,
      rwt: prev.rwt.filter((task) => task.id !== id),
    }));
  };

  const addRwtTask = () => {
    setStandupData((prev) => ({
      ...prev,
      rwt: [...prev.rwt, createRwtTask()],
    }));
  };

  const reorderRwtTask = (startIndex: number, endIndex: number) => {
    setStandupData((prev) => ({
      ...prev,
      rwt: arrayMove(prev.rwt, startIndex, endIndex),
    }));
  };

  const updateMeetingNotes = (value: string) => {
    setStandupData((prev) => ({
      ...prev,
      meetingNotes: value,
    }));
  };

  // Export handlers
  const exportCommonTasksToCSV = (tasks: CommonTask[], filename: string) => {
    const data = tasks.map((task) => ({
      "ADO ID": task.adoId,
      Task: task.taskName,
      Status: task.status,
      Collaborators: task.collaborators.join(", "),
      "Dev Start": task.DevStartDate ? new Date(task.DevStartDate).toLocaleDateString() : "",
      "Dev Due": task.DevDueDate ? new Date(task.DevDueDate).toLocaleDateString() : "",
      "QA Start": task.QAStartDate ? new Date(task.QAStartDate).toLocaleDateString() : "",
      "QA End": task.QAEndDate ? new Date(task.QAEndDate).toLocaleDateString() : "",
      Remarks: task.remarks,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    XLSX.writeFile(wb, filename);
  };

  const exportReleaseTasksToCSV = (tasks: ReleaseTask[], filename: string) => {
    const data = tasks.map((task) => ({
      "ADO ID": task.adoId,
      Feature: task.item,
      Status: task.status.join(", "),
      "CR Link": task.crLink,
      "JMDB ID": task.jmdbId,
      Services: task.services.join(", "),
      Remarks: task.remarks,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    XLSX.writeFile(wb, filename);
  };

  const exportRwtTasksToCSV = (tasks: RwtTask[], filename: string) => {
    const data = tasks.map((task) => ({
      Feature: task.feature,
      Status: task.status,
      Collaborators: task.collaborators.join(", "),
      "Start Date": task.startDate ? new Date(task.startDate).toLocaleDateString() : "",
      "End Date": task.endDate ? new Date(task.endDate).toLocaleDateString() : "",
      Remarks: task.remarks,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    XLSX.writeFile(wb, filename);
  };

  const exportAll = () => {
    const wb = XLSX.utils.book_new();

    // Planning
    const planningData = planning.map((task) => ({
      "ADO ID": task.adoId,
      Task: task.taskName,
      Status: task.status,
      Collaborators: task.collaborators.join(", "),
      "Dev Start": task.DevStartDate ? new Date(task.DevStartDate).toLocaleDateString() : "",
      "Dev Due": task.DevDueDate ? new Date(task.DevDueDate).toLocaleDateString() : "",
      "QA Start": task.QAStartDate ? new Date(task.QAStartDate).toLocaleDateString() : "",
      "QA End": task.QAEndDate ? new Date(task.QAEndDate).toLocaleDateString() : "",
      Remarks: task.remarks,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(planningData), "Planning");

    // Dev & QA
    const devQaData = devQa.map((task) => ({
      "ADO ID": task.adoId,
      Task: task.taskName,
      Status: task.status,
      Collaborators: task.collaborators.join(", "),
      "Dev Start": task.DevStartDate ? new Date(task.DevStartDate).toLocaleDateString() : "",
      "Dev Due": task.DevDueDate ? new Date(task.DevDueDate).toLocaleDateString() : "",
      "QA Start": task.QAStartDate ? new Date(task.QAStartDate).toLocaleDateString() : "",
      "QA End": task.QAEndDate ? new Date(task.QAEndDate).toLocaleDateString() : "",
      Remarks: task.remarks,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(devQaData), "Dev_QA");

    // PROD Issues
    const prodData = prod.map((task) => ({
      "ADO ID": task.adoId,
      Task: task.taskName,
      Status: task.status,
      Collaborators: task.collaborators.join(", "),
      "Dev Start": task.DevStartDate ? new Date(task.DevStartDate).toLocaleDateString() : "",
      "Dev Due": task.DevDueDate ? new Date(task.DevDueDate).toLocaleDateString() : "",
      "QA Start": task.QAStartDate ? new Date(task.QAStartDate).toLocaleDateString() : "",
      "QA End": task.QAEndDate ? new Date(task.QAEndDate).toLocaleDateString() : "",
      Remarks: task.remarks,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodData), "PROD_Issues");

    // Planned Release
    const releaseData = release.map((task) => ({
      "ADO ID": task.adoId,
      Feature: task.item,
      Status: task.status.join(", "),
      "CR Link": task.crLink,
      "JMDB ID": task.jmdbId,
      Services: task.services.join(", "),
      Remarks: task.remarks,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(releaseData), "Planned_Release");

    // Planned RWT
    const rwtData = rwt.map((task) => ({
      Feature: task.feature,
      Status: task.status,
      Collaborators: task.collaborators.join(", "),
      "Start Date": task.startDate ? new Date(task.startDate).toLocaleDateString() : "",
      "End Date": task.endDate ? new Date(task.endDate).toLocaleDateString() : "",
      Remarks: task.remarks,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rwtData), "Planned_RWT");

    // Meeting Notes
    const notesData = [{ "Meeting Notes": meetingNotes.replace(/<[^>]*>/g, "") }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(notesData), "Meeting_Notes");

    XLSX.writeFile(wb, "Standup_All_Data.xlsx");
  };

  const handlePrint = useReactToPrint({
    contentRef: containerRef,
    documentTitle: "Standup_Storyboard",
  });

  const printStyles = `
    @page {
      size: A3 landscape;
      margin: 10mm;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
      }
      /* Scale content to fit */
      div[ref="containerRef"] {
        width: 100%;
        zoom: 0.6; /* Scale down to fit wide content */
        overflow: visible;
      }
      /* Ensure tables don't overflow */
      table {
        width: 100% !important;
        max-width: 100% !important;
      }
      /* Hide scrollbars in print */
      ::-webkit-scrollbar {
        display: none;
      }
    }
  `;

  const handleConnectFile = async () => {
    setIsConnectingFile(true);
    try {
      const result = await storageService.connectFile(standupData);
      skipNextSaveRef.current = true;
      setStandupData(result.data);
      setFileConnection({ name: result.fileName, directory: result.directoryName });
      setLastSyncedAt(new Date());
      toast({
        title: "Shared storage enabled",
        description: `Connected to ${result.directoryName ?? "selected directory"}/DSM.json`,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      toast({
        variant: "destructive",
        title: "Unable to connect to file",
        description: error instanceof Error ? error.message : "Unexpected error occurred.",
      });
    } finally {
      setIsConnectingFile(false);
    }
  };

  const handleDisconnectFile = () => {
    storageService.disconnectFile();
    setFileConnection(null);
    toast({
      title: "Shared file disconnected",
      description: "Reverted to browser local storage.",
    });
  };

  const storageModeLabel = fileConnection
    ? `Shared file: ${fileConnection.directory ? `${fileConnection.directory}/` : ""}${fileConnection.name}`
    : "Local storage only";
  const lastSyncedLabel = lastSyncedAt ? `Last synced ${lastSyncedAt.toLocaleTimeString()}` : "Not synced yet";

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <style>{printStyles}</style>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple to-accent bg-clip-text text-transparent">
            Standup Tasks
          </h1>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex flex-wrap gap-2 justify-end">
              <Badge variant={fileConnection ? "secondary" : "outline"} className="text-sm">
                {storageModeLabel}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {lastSyncedLabel}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 justify-end print:hidden">
              {storageService.isFileSystemAccessSupported && (
                fileConnection ? (
                  <Button variant="outline" className="gap-2" onClick={handleDisconnectFile}>
                    <PlugZap className="h-4 w-4" />
                    Disconnect file
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={handleConnectFile}
                    disabled={isConnectingFile}
                  >
                    <Link2 className="h-4 w-4" />
                    {isConnectingFile ? "Connecting..." : "Connect shared file"}
                  </Button>
                )
              )}
              <Button onClick={() => handlePrint()} className="gap-2" variant="outline">
                <FileText className="h-4 w-4" />
                Export to PDF
              </Button>
              <Button onClick={exportAll} className="gap-2 z-20" size="lg">
                <Download className="h-5 w-5" />
                Export All
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <DashboardStats data={standupData} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CommonTaskTable
            title="Planning"
            tasks={planning}
            onUpdateTask={updateCommonTaskSection("planning")}
            onDelete={deleteCommonTask("planning")}
            onAddTask={() => addCommonTaskToSection("planning")}
            onReorder={reorderCommonTaskSection("planning")}
            onExport={() => exportCommonTasksToCSV(planning, "Planning_Tasks.xlsx")}
            showOngoingOnly={filters.planning}
            onToggleFilter={() => setFilters({ ...filters, planning: !filters.planning })}
            storageKey="planning"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <CommonTaskTable
            title="Ongoing Dev and QA Tasks"
            tasks={devQa}
            onUpdateTask={updateCommonTaskSection("devQa")}
            onDelete={deleteCommonTask("devQa")}
            onAddTask={() => addCommonTaskToSection("devQa")}
            onReorder={reorderCommonTaskSection("devQa")}
            onExport={() => exportCommonTasksToCSV(devQa, "DevQA_Tasks.xlsx")}
            showOngoingOnly={filters.devQa}
            onToggleFilter={() => setFilters({ ...filters, devQa: !filters.devQa })}
            storageKey="devqa"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <CommonTaskTable
            title="PROD Issues"
            tasks={prod}
            onUpdateTask={updateCommonTaskSection("prod")}
            onDelete={deleteCommonTask("prod")}
            onAddTask={() => addCommonTaskToSection("prod")}
            onReorder={reorderCommonTaskSection("prod")}
            onExport={() => exportCommonTasksToCSV(prod, "PROD_Issues.xlsx")}
            showOngoingOnly={filters.prod}
            onToggleFilter={() => setFilters({ ...filters, prod: !filters.prod })}
            storageKey="prod"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <ReleaseTaskTable
            tasks={release}
            onUpdateTask={updateReleaseTask}
            onDelete={deleteReleaseTask}
            onAddTask={addReleaseTask}
            onReorder={reorderReleaseTask}
            onExport={() => exportReleaseTasksToCSV(release, "Planned_Release.xlsx")}
            showOngoingOnly={filters.release}
            onToggleFilter={() => setFilters({ ...filters, release: !filters.release })}
            storageKey="release"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <RwtTaskTable
            tasks={rwt}
            onUpdateTask={updateRwtTask}
            onDelete={deleteRwtTask}
            onAddTask={addRwtTask}
            onReorder={reorderRwtTask}
            onExport={() => exportRwtTasksToCSV(rwt, "Planned_RWT.xlsx")}
            showOngoingOnly={filters.rwt}
            onToggleFilter={() => setFilters({ ...filters, rwt: !filters.rwt })}
            storageKey="rwt"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <MeetingNotes value={meetingNotes} onChange={updateMeetingNotes} />
        </motion.div>
      </div>
    </div>
  );
};
