export { };

declare global {
    interface Window {
        showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
        showDirectoryPicker(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;
    }

    interface OpenFilePickerOptions {
        multiple?: boolean;
        excludeAcceptAllOption?: boolean;
        types?: FilePickerAcceptType[];
    }

    interface FilePickerAcceptType {
        description?: string;
        accept: Record<string, string[]>;
    }

    interface DirectoryPickerOptions {
        id?: string;
        mode?: "read" | "readwrite";
        startIn?: FileSystemHandle | "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos";
    }

    interface FileSystemHandle {
        kind: "file" | "directory";
        name: string;
        isSameEntry(other: FileSystemHandle): Promise<boolean>;
        queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
        requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    }

    interface FileSystemFileHandle extends FileSystemHandle {
        kind: "file";
        getFile(): Promise<File>;
        createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
    }

    interface FileSystemDirectoryHandle extends FileSystemHandle {
        kind: "directory";
        getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions): Promise<FileSystemDirectoryHandle>;
        getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>;
        removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>;
        resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
        keys(): AsyncIterableIterator<string>;
        values(): AsyncIterableIterator<FileSystemHandle>;
        entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
        [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>;
    }

    interface FileSystemCreateWritableOptions {
        keepExistingData?: boolean;
    }

    interface FileSystemGetDirectoryOptions {
        create?: boolean;
    }

    interface FileSystemGetFileOptions {
        create?: boolean;
    }

    interface FileSystemRemoveOptions {
        recursive?: boolean;
    }

    interface FileSystemWritableFileStream extends WritableStream {
        write(data: FileSystemWriteChunkType): Promise<void>;
        seek(position: number): Promise<void>;
        truncate(size: number): Promise<void>;
    }

    type FileSystemWriteChunkType = BufferSource | Blob | string | WriteParams;

    interface WriteParams {
        type: "write" | "seek" | "truncate";
        size?: number;
        position?: number;
        data?: BufferSource | Blob | string;
    }

    interface FileSystemHandlePermissionDescriptor {
        mode?: "read" | "readwrite";
    }
}
