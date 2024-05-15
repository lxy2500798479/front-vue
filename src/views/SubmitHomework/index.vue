<template>
  <el-row style="height: 100%; overflow-y: auto" :gutter="20">
    <div class="submitcontinaer">
      <el-col :span="15">
        <el-tabs>
          <el-tab-pane label="全部作业" name="1"></el-tab-pane>
          <el-tab-pane label="未完成" name="2"></el-tab-pane>
          <el-tab-pane label="已完成" name="3"></el-tab-pane>
        </el-tabs>
        <el-collapse class="collapsecontainer" accordion>
          <el-progress
            :text-inside="true"
            :stroke-width="20"
            :percentage="50"
            status="exception"
            style="margin-bottom: 20px"
          >
            <span>作业完成度</span>
          </el-progress>
          <el-card
            shadow="hover"
            v-for="(item, index) in homeworklist"
            :key="index"
            class="cardcontainer"
          >
            <el-collapse-item class="homelistitem">
              <template #title>
                <span v-if="item.title.length >= 15">{{
                  item.title.substring(0, 15) + "..."
                }}</span>

                <span v-else>{{ item.title }}</span>
                <el-tag>{{ item.courseName }}</el-tag>
              </template>

              <div class="descrip">{{ item.description }}</div>
              <hr />
              <div class="fileInfo" v-if="item.fileName != null">
                <div class="left-content">
                  <img
                    style="height: 60px; width: 60px"
                    src="@/assets/images/icons/Excel.png"
                    alt="文件类型"
                  />
                  <span>{{ item.fileName }}</span>
                </div>
                <div class="right-content">
                  
                  <el-button v-if="!isDownload" type="primary" @click="handleDownload">下载</el-button>
                  <div v-else>
                    <el-progress
                    
                   
                      :percentage="jindu"
                      :duration="1"
                     
                      style="margin-bottom: 10px"
                    >
                    </el-progress>
                    <el-button type="warning" @click="cancleDownload">暂停</el-button>
                    <el-button type="danger">取消</el-button>
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
import { findStudentHomework, downloadFile,stopDownloadFile } from "@/api/student";
import { useUserStore } from "@/store/user";
import { ref } from "vue";

const { user } = useUserStore();

let homeworklist = ref([]);

let isDownload = ref(false);
let jindu = ref(0);

onMounted(async () => {
  const res = await findStudentHomework(user.classId);
  homeworklist.value = res.data;
  homeworklist.value.forEach((item) => {
    item.dueDate = dayjs(item.dueDate).format("YYYY-MM-DD HH:mm:ss");
  });
  // console.log(homeworklist.value);
});

const handleDownload = async () => {
  isDownload.value = true;

  const onDownloadProgress = (progressEvent) => {
    console.log(progressEvent);
    const { loaded, total } = progressEvent;
    const progress = Math.round((loaded * 100) / total);
    jindu.value = progress;
    // 这里可以根据需要更新下载进度，例如更新 UI
    // console.log(`Download Progress: ${progress}%`);
    // return progress;
  };

  try {
    const res = await downloadFile({ onDownloadProgress });
    console.log(res);
    const blob = new Blob([res.data], { type: "application/octet-stream" });

    let fileName = "yourDownloadFile";

    if (res.headers["content-disposition"]) {
      fileName = window.decodeURIComponent(
        res.headers["content-disposition"].split("filename=")[1]
      );
      fileName = fileName.split('"')[1];
    }

    if (window.navigator.msSaveOrOpenBlob) {
      navigator.msSaveBlob(blob, fileName);
    } else {
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.style.display = "none";
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(link.href);
    }
  } catch (error) {
    console.error("Download error:", error);
  }

  isDownload.value = false;
};


const cancleDownload=()=>{
  stopDownloadFile()

}

</script>

<style lang="scss" scoped>
.submitcontinaer {
  height: 100%; // 设置为视口的100%高度
  width: 100%;
  display: flex;
  overflow: hidden; // 防止整体页面滚动

  .collapsecontainer {
    height: calc(100% - 20px); // 根据需要调整，这里假设顶部有20px的其他内容
    width: 100%;
    overflow-y: auto; // 只有这个容器可以滚动
    scrollbar-width: none; // 可以选择隐藏滚动条
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

          .author {
            display: flex;
            justify-content: space-between;
            color: #8f98a9;
            span {
              font-size: 14px;
            }
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
