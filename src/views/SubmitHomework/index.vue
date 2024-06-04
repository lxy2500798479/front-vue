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
          <el-progress :text-inside="true" :stroke-width="20" :percentage="downloadState.progress" status="exception"
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
                  <img style="height: 60px; width: 60px" :src="getImageUrl(item.fileName)" alt="文件类型" />
                  <span>{{ item.fileName }}</span>
                </div>
                <div class="right-content">
                  <el-button v-if="!downloadState.isDownloading" type="primary"
                    @click="handleDownload(item)">下载</el-button>
                  <div v-else>
                    <el-progress :percentage="downloadState.progress" :duration="1"
                      style="margin-bottom: 10px"></el-progress>
                    <el-button type="warning" @click="togglePauseResume">{{ downloadState.isPaused ? '继续' : '暂停'
                      }}</el-button>
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
        <div class="upcontainer">
          <span>下面提交👇</span>

          <el-select filterable placeholder="选择作业" :visible-change="sb" :fit-input-width="true">

            <el-option style="height: 500px;width: 100%;" :value="data">

              <template #default>
                <el-tree :data="data" :props="a" style="width: 100%;"></el-tree>

              </template>
            </el-option>

          </el-select>
        </div>
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

const data = [
  {
    label: 'Level one 1',
    children: [
      {
        label: 'Level two 1-1',
        children: [
          {
            label: 'Level three 1-1-1',
          },
        ],
      },
    ],
  },
  {
    label: 'Level one 2',
    children: [
      {
        label: 'Level two 2-1',
        children: [
          {
            label: 'Level three 2-1-1',
          },
        ],
      },
      {
        label: 'Level two 2-2',
        children: [
          {
            label: 'Level three 2-2-1',
          },
        ],
      },
    ],
  },
  {
    label: 'Level one 3',
    children: [
      {
        label: 'Level two 3-1',
        children: [
          {
            label: 'Level three 3-1-1',
          },
        ],
      },
      {
        label: 'Level two 3-2',
        children: [
          {
            label: 'Level three 3-2-1',
          },
        ],
      },
    ],
  },
]
const a = {
  children: 'children',
  label: 'label',
}


const sb = (e) => {
  console.log(e);
}

const getImageUrl = (name) => {
  const extensionMap = {
    rar: "yasuobao",
    png: "images",
    jpg: "images",
    jpeg: "images",
    gif: "images",
    webp: "images",
    docx: "docx",
    doc: "docx",
    xlsx: "xls",
    xls: "xls",
    pdf: "pdf",
    ppt: "ppt",
    pptx: "ppt",
    mp4: "video",
    avi: "video",
    mpeg: "video",
    mpg: "video",
    mov: "video",
    wmv: "video",
    flv: "video",
    mkv: "video",
    webm: "video",
    mp3: "music",
    wav: "music",
    ogg: "music",
    aac: "music",
    flac: "music",
    m4a: "music",
    wma: "music",
    txt: "txt"
  };

  const parts = name.split(".");
  const extension = parts.length > 1 ? parts.pop() : "";
  const filename = extensionMap[extension] || "unknown";

  return new URL(`../../assets/images/icons/${filename}.png`, import.meta.url).href;
};

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
  categorizeHomework();
};



const categorizeHomework = () => {
  const categorized = {};
  // homeworklist.value.forEach((item) => {
  //   if (!categorized[item.courseName]) {
  //     categorized[item.courseName] = [];
  //   }
  //   categorized[item.courseName].push(item);
  // });

  homeworklist.value.forEach((item) => {
    if (!categorized[item.courseName]) {
      categorized[item.courseName] = [];
    }
    categorized[item.courseName].push(item);
  });

  console.log(categorized);

}


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

  .upcontainer {
    text-align: center;



    :deep(.el-select-dropdown__item) {
      padding: 0;
    }
  }

  :deep(.el-select-dropdown__item) {
    padding: 0;
  }

  :deep(el-select-dropdown__item) {
    padding: 0;
  }
}
</style>
