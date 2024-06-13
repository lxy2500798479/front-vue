import axios from "axios";
import md5Worker from "@/utils/md5Worker.js?worker";
import { reactive, ref } from 'vue';

export const loadMD5 = reactive({
  isLoading: false,
  md5: '',
  worker: null
});

export const handleFileChange = async (file, fileList, upfile, loadMD5) => {
  const latestFile = fileList[fileList.length - 1];
  if (latestFile) {
    upfile.value = latestFile.raw || latestFile;
    let { md5, worker } = await workmd5(upfile.value);
    loadMD5.md5 = md5.hash;
    loadMD5.worker = worker;
  }
};

const workmd5 = async (file) => {
  loadMD5.isLoading = true;
  return new Promise((resolve, reject) => {
    const worker = new md5Worker();
    worker.postMessage({ file });

    worker.onmessage = (event) => {
      loadMD5.isLoading = false;
      resolve({ md5: event.data, worker });
    };
  });
};

export const createFileChunk = (file, size = 50 * 1024 * 1024) => {
  const fileChunkList = [];
  let count = 0;

  if (file.size <= size) {
    fileChunkList.push(file);
    return fileChunkList;
  }

  while (count < file.size) {
    fileChunkList.push(file.slice(count, count + size));
    count += size;
  }

  return fileChunkList;
};

export const uploadChunkBase = async (
  chunkList,
  contentType = "application/octet-stream",
  isPaused
) => {
  let successCount = 0;
  let totalChunks = chunkList.length;
  return new Promise((resolve, reject) => {
    const handler = () => {
      if (chunkList.length && !isPaused.value) {
        const chunkItem = chunkList.shift();
        axios
          .put(chunkItem.uploadUrl, chunkItem.chunk, {
            headers: {
              "Content-Type": contentType,
            },
          })
          .then((response) => {
            if (response.status == 200) {
              successCount++;
              handler();
            } else {
              console.log(
                "上传失败：" + response.status + "，" + response.statusText
              );
            }
          })
          .catch((error) => {
            chunkList.push(chunkItem);
            handler();
          });
      }
      if (successCount >= totalChunks) {
        resolve();
      }
    };

    for (let i = 0; i < totalChunks; i++) {
      handler();
    }
  });
};
