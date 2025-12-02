import { EMPTY_STANDUP_DATA, StandupData, reviveStandupData } from "@/types/standupTask";

type Listener = (data: StandupData) => void;


class StorageService {
  private readonly lsKey = "standup_data_v2";
  private readonly isBrowser = typeof window !== "undefined";
  private listeners = new Set<Listener>();
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private fileHandle: FileSystemFileHandle | null = null;
  private fileWatcher: number | null = null;
  private lastFileTimestamp: number | null = null;
  private hasAttemptedProjectFileLoad = false;
  private projectFilePromise: Promise<StandupData | null> | null = null;

  constructor() {
    if (this.isBrowser) {
      window.addEventListener("storage", this.handleStorageEvent);
    }
  }

  get isFileSystemAccessSupported() {
    return this.isBrowser && typeof window.showDirectoryPicker === "function";
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async load(): Promise<StandupData> {
    if (!this.isBrowser) {
      return EMPTY_STANDUP_DATA;
    }

    if (this.fileHandle) {
      return this.readFromFile();
    }

    const projectData = await this.loadFromProjectFile();
    if (projectData) {
      try {
        localStorage.setItem(this.lsKey, JSON.stringify(projectData));
      } catch (error) {
        console.error("Failed to cache project DSM.json into localStorage", error);
      }
      return projectData;
    }

    const raw = localStorage.getItem(this.lsKey);
    if (!raw) {
      return EMPTY_STANDUP_DATA;
    }

    try {
      return reviveStandupData(JSON.parse(raw));
    } catch (error) {
      console.error("Failed to parse local storage data", error);
      return EMPTY_STANDUP_DATA;
    }
  }

  async save(data: StandupData) {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(this.lsKey, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to persist standup data to localStorage", error);
    }

    if (!this.fileHandle) return;

    try {
      await this.ensurePermission(this.fileHandle, true);
      const writable = await this.fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      await this.updateLastModified();
    } catch (error) {
      console.error("Failed to persist standup data to file", error);
    }
  }

  async connectFile(currentData: StandupData) {
    if (!this.isFileSystemAccessSupported || !window.showDirectoryPicker) {
      throw new Error("This browser does not support shared file storage.");
    }

    const directoryHandle = await window.showDirectoryPicker({});
    await this.ensurePermission(directoryHandle, true);

    const fileHandle = await directoryHandle.getFileHandle("DSM.json", { create: true });
    await this.ensurePermission(fileHandle, true);

    this.directoryHandle = directoryHandle;
    this.fileHandle = fileHandle;

    let data = EMPTY_STANDUP_DATA;
    try {
      const file = await fileHandle.getFile();
      if (file.size > 0) {
        const text = await file.text();
        data = reviveStandupData(JSON.parse(text));
      } else {
        data = currentData ?? EMPTY_STANDUP_DATA;
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
      }
    } catch (error) {
      console.error("Failed to load data from DSM.json", error);
      data = currentData ?? EMPTY_STANDUP_DATA;
    }

    await this.updateLastModified();
    this.startFileWatcher();

    return { data, fileName: "DSM.json", directoryName: directoryHandle.name };
  }

  disconnectFile() {
    this.directoryHandle = null;
    this.fileHandle = null;
    if (this.fileWatcher) {
      window.clearInterval(this.fileWatcher);
      this.fileWatcher = null;
    }
    this.lastFileTimestamp = null;
  }

  private startFileWatcher() {
    if (!this.isBrowser || !this.fileHandle) return;
    if (this.fileWatcher) {
      window.clearInterval(this.fileWatcher);
    }

    this.fileWatcher = window.setInterval(() => {
      this.checkForExternalFileUpdates();
    }, 5000);
  }

  private async checkForExternalFileUpdates() {
    if (!this.fileHandle) return;
    try {
      const file = await this.fileHandle.getFile();
      if (this.lastFileTimestamp && file.lastModified <= this.lastFileTimestamp) {
        return;
      }

      this.lastFileTimestamp = file.lastModified;
      const text = await file.text();
      this.notify(reviveStandupData(text ? JSON.parse(text) : EMPTY_STANDUP_DATA));
    } catch (error) {
      console.error("Failed to read shared file updates", error);
    }
  }

  private async readFromFile(): Promise<StandupData> {
    if (!this.fileHandle) {
      return EMPTY_STANDUP_DATA;
    }

    try {
      const file = await this.fileHandle.getFile();
      const text = await file.text();
      this.lastFileTimestamp = file.lastModified;
      return text ? reviveStandupData(JSON.parse(text)) : EMPTY_STANDUP_DATA;
    } catch (error) {
      console.error("Failed to read standup data from file", error);
      return EMPTY_STANDUP_DATA;
    }
  }

  private async ensurePermission(handle: FileSystemHandle, write: boolean) {
    const options: FileSystemHandlePermissionDescriptor = {
      mode: write ? "readwrite" : "read",
    };

    if ((await handle.queryPermission(options)) === "granted") {
      return;
    }

    if ((await handle.requestPermission(options)) === "granted") {
      return;
    }

    throw new Error("Permission to access the file was denied.");
  }

  private async updateLastModified() {
    if (!this.fileHandle) return;
    try {
      const file = await this.fileHandle.getFile();
      this.lastFileTimestamp = file.lastModified;
    } catch (error) {
      console.error("Unable to update file last modified timestamp", error);
    }
  }

  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key !== this.lsKey || !event.newValue) return;
    try {
      this.notify(reviveStandupData(JSON.parse(event.newValue)));
    } catch (error) {
      console.error("Failed to process storage event payload", error);
    }
  };

  private notify(data: StandupData) {
    this.listeners.forEach((listener) => listener(data));
  }

  private loadFromProjectFile(): Promise<StandupData | null> {
    if (!this.isBrowser || this.hasAttemptedProjectFileLoad) {
      return Promise.resolve(null);
    }

    if (!this.projectFilePromise) {
      this.projectFilePromise = (async () => {
        this.hasAttemptedProjectFileLoad = true;
        try {
          const response = await fetch("/DSM.json", { cache: "no-cache" });
          if (!response.ok) {
            return null;
          }
          const text = await response.text();
          if (!text.trim()) {
            return null;
          }
          return reviveStandupData(JSON.parse(text));
        } catch (error) {
          console.warn("No DSM.json found in project root or failed to parse it.", error);
          return null;
        }
      })();
    }

    return this.projectFilePromise;
  }
}

export const storageService = new StorageService();


