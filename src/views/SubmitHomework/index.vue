<template>
  <el-row style="height: 100%; overflow-y: auto" :gutter="20">
    <div class="submitcontinaer">
      <el-col :span="15">
        <el-tabs>
          <el-tab-pane label="全部作业" name="1"></el-tab-pane>
          <el-tab-pane label="未完成" name="2"></el-tab-pane>
          <el-tab-pane label="已完成" name="3"></el-tab-pane>
          <el-tab-pane label="已截至" name="4"></el-tab-pane>
        </el-tabs>
        <el-collapse class="collapsecontainer" accordion>
          <el-progress :text-inside="true" :stroke-width="20" :percentage="50" status="exception"
            style="margin-bottom: 20px">
            <span>作业完成度</span>
          </el-progress>
          <el-card shadow="hover" v-for="(item, index) in homeworklist" :key="index" class="cardcontainer">
            <el-collapse-item class="homelistitem">
              <template #title>
                <span v-if="item.title.length >= 15">{{ item.title.substring(0, 15) + "..." }}</span>
                <span v-else>{{ item.title }}</span>
                <el-tag>{{ item.courseName }}</el-tag>
              </template>
              <div class="descrip">{{ item.description }}</div>
              <hr />
              <div class="fileInfo" v-if="item.fileName != null">
                <div class="left-content">
                  <img style="height: 60px; width: 60px" src="@/assets/images/icons/Excel.png" alt="文件类型" />
                  <span>{{ item.fileName }}</span>
                </div>
                <div class="right-content">
                  <el-button v-if="!isDownload" type="primary" @click="handleDownload(item)">下载</el-button>
                  <div v-else>
                    <el-progress :percentage="jindu" :duration="1" style="margin-bottom: 10px"></el-progress>
                    <el-button type="warning" @click="pausedDownload">暂停</el-button>
                    <el-button type="success" @click="resumeDownload(item)">恢复</el-button>
                    <el-button type="danger" @click="cancelDownload">取消</el-button>
                  </div>
                </div>
              </div>
              <div class="author">
                <span>发布老师:{{ item.teacherName }}</span>
                <span>截至时间：{{ item.dueDate }}</span>
              </div>
            </el-collapse-item>
          </el-card>
        </el-collapse>
      </el-col>
      <el-col :span="8">
        <div class="upcontainer">提交作业</div>
      </el-col>
    </div>
  </el-row>
</template>

<script setup>
import dayjs from "dayjs";
import { findStudentHomework } from "@/api/student";
import { downloadFile } from "@/api/file";
import { useUserStore } from "@/store/user";
import axios from "axios";

const { user } = useUserStore();

let homeworklist = ref([]);
let isDownload = ref(false);
let jindu = ref(0);
let cancelTokenSource = ref(null);
let isPaused = ref(false);
let downloadedBytes = ref(0);

onMounted(async () => {
  cancelTokenSource.value = axios.CancelToken.source();
  loadHomework();
});

const loadHomework = async () => {
  cancelTokenSource.value = axios.CancelToken.source();
  try {
    const res = await findStudentHomework(user.classId, cancelTokenSource.value.token);
    const filteredData = res.data.filter((item) => item !== null);
    const sortedData = filteredData.sort((a, b) => new Date(b.createAt) - new Date(a.createAt));
    homeworklist.value = sortedData;
    homeworklist.value.forEach((item) => {
      item.dueDate = dayjs(item.dueDate).format("YYYY-MM-DD HH:mm:ss");
    });
    console.log(homeworklist.value);
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("Homework loading canceled");
    } else {
      console.error("Failed to load homework", error);
    }
  }
};

const handleDownload = async (item) => {
  jindu.value = 0;
  isDownload.value = true;
  isPaused.value = false;
  downloadedBytes.value = 0;
  await download(item);
};

const onDownloadProgress = (progressEvent) => {
  const { loaded, total } = progressEvent;
  downloadedBytes.value = loaded;
  jindu.value = Math.round((loaded / total) * 100);
};

const download = async (item) => {
  cancelTokenSource.value = axios.CancelToken.source();
  try {
    const response = await downloadFile(
      { homeworkId: item.homeworkId },
      onDownloadProgress,
      cancelTokenSource.value.token,
      { Range: `bytes=${downloadedBytes.value}-` }
    );
    const blob = new Blob([response.data], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.fileName;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    isDownload.value = false;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("Download paused");
    } else {
      console.log(error);
    }
  }
};

const pausedDownload = () => {
  if (cancelTokenSource.value) {
    cancelTokenSource.value.cancel();
    isPaused.value = true;
  }
};

const resumeDownload = (item) => {
  if (isPaused.value) {
    download(item);
    isPaused.value = false;
  }
};

const cancelDownload = () => {
  if (cancelTokenSource.value) {
    cancelTokenSource.value.cancel();
    isDownload.value = false;
    isPaused.value = false;
    jindu.value = 0;
    downloadedBytes.value = 0;
  }
};
</script>

<style lang="scss" scoped>
.submitcontinaer {
  height: 100%;
  width: 100%;
  display: flex;
  overflow: hidden;

  .collapsecontainer {
    height: calc(100% - 20px);
    width: 100%;
    overflow-y: auto;
    scrollbar-width: none;
    border: none;

    :deep(.el-collapse-item__wrap) {
      border: none;
    }

    .cardcontainer {
      &:last-child {
        margin-bottom: 50px;
      }

      :deep(.el-card__body) {
        height: 100%;
        padding: 0;
      }

      &:not(:last-child) {
        margin-bottom: 20px;
      }

      .homelistitem {
        .descrip {
          font-size: 18px;
          margin-bottom: 10px;
        }

        .fileInfo {
          display: flex;
          justify-content: space-around;
          align-items: center;

          .left-content {
            display: flex;
            align-items: center;
            flex-direction: column;
          }
        }

        .author {
          display: flex;
          justify-content: space-between;
          color: #8f98a9;

          span {
            font-size: 14px;
          }
        }

        :deep(.el-collapse-item__header) {
          border: none;
          position: relative;
          font-family: "myFont", sans-serif;
          padding-left: 20px;
          height: 80px;
          overflow: hidden;
        }

        :deep(.el-collapse-item__content) {
          padding: 0;
        }

        :deep(.el-collapse-item__wrap) {
          .el-collapse-item__content {
            padding: 0 15px 5px;
            font-size: 15px;
          }
        }
      }
    }
  }
}
</style>
