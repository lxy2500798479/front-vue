import axios from "axios";
import { reactive } from "vue";
import { downloadFile } from "@/api/file";
import { openDB } from "idb";

export const useDownload = () => {
  const downloadState = reactive({
    isDownloading: false,
    isPaused: false,
    progress: 0,
    downloadedBytes: 0,
    cancelTokenSource: null,
    downloadChunks: [],
    currentItem: null
  });
  const chunkSize = 20 * 1024 * 1024; // 每个分片的大小，20MB

  // 初始化 IndexedDB
  const initDB = async () => {
    return openDB("DownloadDB", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("chunks")) {
          db.createObjectStore("chunks", { keyPath: "id" });
        }
      }
    });
  };

  // 保存分片到 IndexedDB
  const saveChunkToDB = async (chunk, itemId, index) => {
    const db = await initDB();
    await db.put("chunks", { id: `${itemId}-${index}`, chunk: chunk.data, index });
  };

  // 从 IndexedDB 中检索分片
  const getChunksFromDB = async (itemId) => {
    const db = await initDB();
    const keys = await db.getAllKeys("chunks");
    const itemChunks = keys.filter(key => key.startsWith(itemId)).map(key => db.get("chunks", key));
    return Promise.all(itemChunks);
  };

  // 从 IndexedDB 中删除分片
  const deleteChunksFromDB = async (itemId) => {
    const db = await initDB();
    const keys = await db.getAllKeys("chunks");
    const itemKeys = keys.filter(key => key.startsWith(itemId));
    await Promise.all(itemKeys.map(key => db.delete("chunks", key)));
  };

  const handleDownload = async (item) => {
    resetDownloadState();
    downloadState.isDownloading = true;
    downloadState.currentItem = item;
    const existingChunks = await getChunksFromDB(item.homeworkId);
    if (existingChunks.length) {
      downloadState.downloadChunks = existingChunks.map(entry => entry);
      downloadState.downloadedBytes = existingChunks.reduce((acc, entry) => acc + entry.chunk.size, 0);
      downloadState.progress = Math.floor((downloadState.downloadedBytes / item.fileSize) * 100);
      if (downloadState.progress > 100) {
        downloadState.progress = 100;
      }
    }
    await fetchChunksSequentially(item, downloadState.downloadedBytes);
  };

  const fetchChunksSequentially = async (item, start) => {
    const totalChunks = Math.ceil(item.fileSize / chunkSize);
    let currentChunk = Math.floor(start / chunkSize);

    while (currentChunk < totalChunks) {
      if (downloadState.isPaused || !downloadState.isDownloading) {
        break;
      }

      const startByte = currentChunk * chunkSize;
      const endByte = Math.min(startByte + chunkSize, item.fileSize) - 1;

      try {
        const response = await downloadFile(
          { homeworkId: item.homeworkId },
          null,
          downloadState.cancelTokenSource.token,
          { Range: `bytes=${startByte}-${endByte}` }
        );

        const chunk = { index: currentChunk, data: response.data };
        downloadState.downloadChunks.push(chunk);
        await saveChunkToDB(chunk, item.homeworkId, currentChunk);
        downloadState.downloadedBytes += response.data.size;
        downloadState.progress = Math.floor((downloadState.downloadedBytes / item.fileSize) * 100);
        if (downloadState.progress > 100) {
          downloadState.progress = 100;
        }
        currentChunk++;
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Download paused or canceled at chunk", currentChunk);
        } else {
          console.error("Error downloading chunk", currentChunk, error);
        }
      }
    }

    if (downloadState.downloadedBytes >= item.fileSize) {
      await saveFile(item.fileName, item.homeworkId);
      await deleteChunksFromDB(item.homeworkId);
    }
  };

  const saveFile = async (fileName, itemId) => {
    const existingChunks = await getChunksFromDB(itemId);
    const allChunks = [...existingChunks];
    const sortedChunks = allChunks.sort((a, b) => a.index - b.index).map(chunk => chunk.chunk);
    const blob = new Blob(sortedChunks, { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    downloadState.isDownloading = false;
    URL.revokeObjectURL(link.href);
    downloadState.downloadChunks.length = 0;
    downloadState.progress = 100;
  };

  const togglePauseResume = async () => {
    if (downloadState.isPaused) {
      resumeDownload();
    } else {
      pauseDownload();
    }
  };

  const pauseDownload = () => {
    if (downloadState.cancelTokenSource) {
      downloadState.cancelTokenSource.cancel("Download paused");
      downloadState.isPaused = true;
    }
  };

  const resumeDownload = async () => {
    if (downloadState.isPaused) {
      downloadState.cancelTokenSource = axios.CancelToken.source();
      downloadState.isDownloading = true;
      downloadState.isPaused = false;
      await fetchChunksSequentially(downloadState.currentItem, downloadState.downloadedBytes);
    }
  };

  const cancelDownload = () => {
    deleteChunksFromDB(downloadState.currentItem.homeworkId);
    if (downloadState.cancelTokenSource) {
      downloadState.cancelTokenSource.cancel("Download canceled");
      resetDownloadState();
     
      downloadState.isDownloading = false;
    }
  };

  const resetDownloadState = () => {
    downloadState.cancelTokenSource = axios.CancelToken.source();
    downloadState.isDownloading = false;
    downloadState.isPaused = false;
    downloadState.progress = 0;
    downloadState.downloadChunks.length = 0;
    downloadState.downloadedBytes = 0;
    downloadState.currentItem = null;
  };

  return {
    downloadState,
    handleDownload,
    togglePauseResume,
    cancelDownload
  };
};
