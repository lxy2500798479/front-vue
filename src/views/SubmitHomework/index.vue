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
          <el-progress :text-inside="true" :stroke-width="20" :percentage="downloadState.progress" status="exception" style="margin-bottom: 20px">
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
                  <img style="height: 60px; width: 60px" :src="getImageUrl(item.fileName)" alt="文件类型" />
                  <span>{{ item.fileName }}</span>
                </div>
                <div class="right-content">
                  <el-button v-if="!downloadState.isDownloading" type="primary" @click="handleDownload(item)">下载</el-button>
                  <div v-else>
                    <el-progress :percentage="downloadState.progress" :duration="1" style="margin-bottom: 10px"></el-progress>
                    <el-button type="warning" @click="togglePauseResume">{{ downloadState.isPaused ? '继续' : '暂停' }}</el-button>
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
import axios from "axios";
import { useDownload } from "@/utils/useDownload";
import dayjs from "dayjs";
import { findStudentHomework } from "@/api/student";
import { useUserStore } from "@/store/user";
const { user } = useUserStore();

// const file_path= ref("@/assets/images/icons/Excel.png");

let str="Excel";

const getImageUrl=(name)=>{


  let parts=name.split(".");
  let filename=parts[0];

  if(parts.length>1){
    const extension=parts[parts.length-1];
    switch(extension){
      case "rar":
        filename="yasuobao"
        break
      case 'png','jpg','jpeg','gif':
        filename="images"
        break
    }
  }

  return new URL("../../assets/images/icons/"+filename+".png",import.meta.url).href
}

let homeworklist = ref([]);
const { downloadState, handleDownload, togglePauseResume, cancelDownload } = useDownload();

const loadHomework = async () => {
  const res = await findStudentHomework(user.classId, downloadState.cancelTokenSource.token);
  const filteredData = res.data.filter((item) => item !== null);
  const sortedData = filteredData.sort((a, b) => new Date(b.createAt) - new Date(a.createAt));
  homeworklist.value = sortedData;
  homeworklist.value.forEach((item) => {
    item.dueDate = dayjs(item.dueDate).format("YYYY-MM-DD HH:mm:ss");
  });
};

onMounted(async () => {
  downloadState.cancelTokenSource = axios.CancelToken.source();
  loadHomework();
});

onUnmounted(() => {
  if (downloadState.cancelTokenSource) {
    downloadState.cancelTokenSource.cancel("Component unmounted");
  }
});
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
