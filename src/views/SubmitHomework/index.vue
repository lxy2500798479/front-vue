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
          <el-progress
            :text-inside="true"
            :stroke-width="20"
            :percentage="downloadState.progress"
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
                    :src="getImageUrl(item.fileName)"
                    alt="文件类型"
                  />
                  <span>{{ item.fileName }}</span>
                </div>
                <div class="right-content">
                  <el-button
                    v-if="!downloadState.isDownloading"
                    type="primary"
                    @click="handleDownload(item)"
                    >下载</el-button
                  >
                  <div v-else>
                    <el-progress
                      :percentage="downloadState.progress"
                      :duration="1"
                      style="margin-bottom: 10px"
                    ></el-progress>
                    <el-button type="warning" @click="togglePauseResume">{{
                      downloadState.isPaused ? "继续" : "暂停"
                    }}</el-button>
                    <el-button type="danger" @click="cancelDownload"
                      >取消</el-button
                    >
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
          <el-form :model="upcontainer" :rules="rules" ref="upForm">
            <span style="text-align: center">下面提交👇</span>
            <el-form-item prop="homeworkId">
              <el-tree-select
                :data="data"
                v-model="upcontainer.homeworkId"
                value-prop="value"
                :render-after-expand="false"
                style="width: 350px"
                :default-expand-all="false"
                :highlight-current="true"
                :draggable="false"
                filterable
                placeholder="请 选 择 作 业   🙂"
                @change="handleNodeClick"
              >
              </el-tree-select>
            </el-form-item>
            <el-form-item prop="faceback">
              <el-input
                v-model="upcontainer.feedback"
                type="textarea"
                :rows="2"
                placeholder="对你的老师慰问一下🖕"
              />
            </el-form-item>
            <el-form-item>
              <el-upload
                ref="fileRef"
                :auto-upload="false"
                list-type="text"
                class="el-upload-ui"
                drag
                :limit="1"
                :on-exceed="handleExceed"
                :on-change="handleFileChange"
                :before-remove="handleRemove"
              >
                <el-icon class="el-icon--upload"
                  ><upload-filled style="font-size: 50px"
                /></el-icon>
                <div class="el-upload__text">
                  （选择上传）将文件拖到此处，或<em>点击上传</em>
                </div>
              </el-upload>
            </el-form-item>
            <el-button
              @click="handleSubmitHomework"
              style="width: 100%"
              :type="loadingBtn.loading ? 'danger' : 'primary'"
              :loading="loadingBtn.loading"
            >
              <span v-if="!loadingBtn.loading">{{ loadingBtn.buttonText }}</span>

              <template #loading>
                <svg
                  t="1718281415726"
                  class="icon"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  p-id="10809"
                  width="35"
                  height="35"
                  style="margin-right: 10px;"
                >
                  <path
                    d="M768.2048 839.68c-14.848 0-26.9312-10.9568-26.9312-24.4736s12.0832-24.4736 26.9312-24.4736c111.3088 0 201.8304-96.5632 201.8304-215.3472s-90.5216-215.3472-201.8304-215.3472c-10.752 0-21.9136 1.1264-34.2016 3.3792-10.1376 1.8432-20.6848-1.7408-26.8288-9.3184-47.2064-57.1392-114.9952-90.0096-185.9584-90.0096-107.2128 0-201.8304 72.9088-235.2128 181.4528-1.9456 6.4512-6.7584 11.8784-13.2096 14.9504-6.4512 3.1744-14.0288 3.7888-21.0944 1.6384-13.824-4.096-27.8528-6.2464-41.5744-6.2464-86.1184 0-156.0576 75.0592-156.0576 167.424 0 92.2624 70.0416 167.424 156.0576 167.424h311.1936c14.848 0 26.9312 10.9568 26.9312 24.4736S536.064 839.68 521.1136 839.68H210.0224C94.208 839.68 0 742.6048 0 623.3088s94.208-216.3712 210.0224-216.3712c10.6496 0 21.2992 0.8192 31.9488 2.56C287.8464 292.2496 397.312 215.04 521.1136 215.04c83.0464 0 161.8944 35.4304 218.8288 97.6896 9.728-1.2288 19.0464-1.7408 28.2624-1.7408C909.312 310.9888 1024 429.568 1024 575.3856S909.312 839.68 768.2048 839.68z"
                    p-id="10810"
                  ></path>
                  <path
                    d="M663.2448 655.9744c-5.0176 0-10.1376-1.2288-14.6432-3.9936l-109.8752-64.8192-109.8752 64.8192c-12.4928 7.3728-29.184 4.096-37.2736-7.168-8.0896-11.3664-4.5056-26.5216 7.8848-33.8944l124.5184-73.5232c8.9088-5.2224 20.3776-5.2224 29.2864 0l124.6208 73.5232c12.4928 7.3728 16.0768 22.528 7.8848 33.8944-5.0176 7.168-13.7216 11.1616-22.528 11.1616z"
                    p-id="10811"
                  ></path>
                  <path
                    d="M761.1392 839.68C623.616 839.68 511.6928 725.7088 511.6928 585.5232c0-13.5168 12.0832-24.4736 26.9312-24.4736s26.9312 10.9568 26.9312 24.4736c0 113.152 87.6544 205.1072 195.4816 205.1072 14.848 0 26.9312 10.9568 26.9312 24.4736S775.9872 839.68 761.1392 839.68z"
                    p-id="10812"
                  ></path>
                </svg>
               <span style="font-family: 'myFont';"> 芜湖！起飞喽！🚀</span>
              </template>
            </el-button>
          </el-form>
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
import md5Worker from "@/utils/md5Worker.js?worker";
import { checkExist, getPartUrl, mergePart, getPartInfo } from "@/api/file";
import { submitHomework } from "@/api/student";
import { reactive } from "vue";
const { user } = useUserStore();

const upForm = ref();
const data = ref([]);

const upcontainer = reactive({
  homeworkId: "",
  feedback: "",
});

//验证规则
const rules = reactive({
  homeworkId: [
    { required: true, message: "请选择作业", trigger: "submit" },
    { min: 1, max: 100, message: "长度在 1 到 100 个字符", trigger: "submit" },
  ],
});

const handleNodeClick = (e) => {
  upcontainer.homeworkId = e;
  console.log(upcontainer.homeworkId);
};

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
    txt: "txt",
  };

  const parts = name.split(".");
  // console.log(parts);
  const extension = parts.length > 1 ? parts.pop() : "";
  // console.log(extension);
  const filename = extensionMap[extension] || "weizhiwenjian";
  // console.log(filename);

  return new URL(`../../assets/images/icons/${filename}.png`, import.meta.url)
    .href;
};

let homeworklist = ref([]);
const { downloadState, handleDownload, togglePauseResume, cancelDownload } =
  useDownload();

//获取作业(还没优化)
const loadHomework = async () => {
  const res = await findStudentHomework(
    user.classId,
    downloadState.cancelTokenSource.token
  );
  const filteredData = res.data.filter((item) => item !== null);
  const sortedData = filteredData.sort(
    (a, b) => new Date(b.createAt) - new Date(a.createAt)
  );
  homeworklist.value = sortedData;
  homeworklist.value.forEach((item) => {
    item.dueDate = dayjs(item.dueDate).format("YYYY-MM-DD HH:mm:ss");
  });
  categorizeHomework();
};
//分类
function categorizeHomework() {
  const categorized = {};

  // 遍历homeworklist，根据courseName进行分类
  homeworklist.value.forEach((item) => {
    if (!categorized[item.courseName]) {
      categorized[item.courseName] = {
        label: item.courseName,
        value: item.courseName, // 可选，如果需要也可以给课程节点加上value
        children: [],
      };
    }
    // 调整子项结构，使用 homeworkId 作为 value，title 作为 label
    categorized[item.courseName].children.push({
      value: item.homeworkId,
      label: item.title,
      // 如果有其他需要保留的字段，可以继续添加到这里
    });
  });

  // 将分类后的数据转换为树形结构
  const treeData = [];
  for (const course in categorized) {
    treeData.push(categorized[course]);
  }

  data.value = treeData;
  // console.log(treeData);
}

const loadMD5 = reactive({
  isLoading: false,
  md5: "",
  worker: null,
});
const fileRef = ref(null);
const upfile = ref(null);
const handleExceed = (files) => {
  fileRef.value.clearFiles();
  const newFile = files[0]; // 修改变量名以避免与外部的 ref 变量冲突
  fileRef.value.handleStart(newFile); // 使用新的变量名
};
const handleFileChange = async (file, fileList) => {
  // 假设你只关心最新的一个文件，因为你设置了 :limit="1"
  // fileList 是当前的文件列表，它应该包含了最新上传的文件
  const latestFile = fileList[fileList.length - 1];
  if (latestFile) {
    // 直接保存 File 对象
    upfile.value = latestFile.raw || latestFile; // 兼容性写法，确保是 File 对象
    console.log(upfile.value);

    let { md5, worker } = await workmd5(upfile.value);
    loadMD5.md5 = md5.hash;
    loadMD5.worker = worker;
  }
};

const handleRemove = (file, fileList) => {
  upfile.value = null;
};

const workmd5 = async (file) => {
  loadMD5.isLoading = true;
  return new Promise((resolve, reject) => {
    const worker = new md5Worker();
    // console.log(file);
    worker.postMessage({ file });

    worker.onmessage = (event) => {
      loadMD5.isLoading = false;
      // console.log(event.data);
      resolve({ md5: event.data, worker }); // 返回 MD5 值和 Worker 实例
    };
  });
};
const fileUploadId = ref();
const checkAndUpload = (md5) => {
  return new Promise((resolve, reject) => {
    checkExist(md5, user.userType).then((res) => {
      if (res.data == null) {
        loadMD5.worker.terminate();

        let fileName = upfile.value.name;
        let dotIndex = fileName.lastIndexOf("."); // 找到最后一个点的位置
        let fileNameWithoutExt =
          dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
        let fileExt = dotIndex !== -1 ? fileName.substring(dotIndex + 1) : "";

        let finalFileName = fileExt
          ? `${fileNameWithoutExt}_${md5}.${fileExt}`
          : `${fileNameWithoutExt}_${md5}`;
        // console.log(user.className+"/"+finalFileName);

        let encodedFileName = user.className + "/" + finalFileName;

        let fileChunks = createFileChunk(upfile.value);
        console.log(encodedFileName);
        let updata = {
          fileName: encodedFileName,
          partSize: 1,
          contentType: upfile.value.type,
        };
        console.log(upfile.value.size);

        getPartUrl(updata).then((res) => {
          fileUploadId.value = res.data.uploadId;
          let chunklist = [];
          fileChunks.map((item, index) => {
            chunklist.push({
              chunkNumber: index + 1,
              chunk: item,
              uploadUrl: res.data.uploadUrls[index],
              progress: 0,
              status: "-",
            });
          });
          uploadChunkBase(chunklist).then((res) => {
            let par = {
              fileName: encodedFileName,
              uploadId: fileUploadId.value,
            };
            mergePart(par).then((res) => {
              resolve(res); // 在满足条件时执行 mergePart(par)，并将结果传递给外部
            });
          });
        });
      } else {
        resolve(res);
      }
    });
  });
};

const createFileChunk = (file, size = 50 * 1024 * 1024) => {
  const fileChunkList = [];
  let count = 0;

  // 如果文件大小小于等于切割大小，则直接返回整个文件作为一个块
  if (file.size <= size) {
    fileChunkList.push(file);
    return fileChunkList;
  }

  // 切割文件
  while (count < file.size) {
    fileChunkList.push(file.slice(count, count + size));
    count += size;
  }

  return fileChunkList;
};
//分片上传
const uploadChunkBase = async (
  chunkList,
  contentType = "application/octet-stream"
) => {
  let successCount = 0;
  let totalChunks = chunkList.length;
  return new Promise((resolve, reject) => {
    const handler = () => {
      if (chunkList.length) {
        const chunkItem = chunkList.shift();
        // console.log(chunkItem);
        // console.log(chunkItem);
        // 直接上传二进制，不需要构造 FormData，否则上传后文件损坏
        axios
          .put(chunkItem.uploadUrl, chunkItem.chunk, {
            headers: {
              "Content-Type": contentType,
            },
          })
          .then((response) => {
            if (response.status == 200) {
              console.log("分片：" + chunkItem.chunkNumber + " 上传成功");
              successCount++;

              // 继续上传下一个分片
              // handler()
              // getPartInfo({
              //   fileName: upfile.value.name,
              //   uploadId: fileUploadId.value,
              // }).then((res) => {
              //   console.log(res);
              // });
              // setTimeout(handler, 1000);

              handler();
            } else {
              // 注意：这里没有针对失败做处理，请根据自己需求修改
              console.log(
                "上传失败：" + response.status + "，" + response.statusText
              );
            }
          })
          .catch((error) => {
            // 更新状态
            console.log(
              "分片：" + chunkItem.chunkNumber + " 上传失败，" + error
            );
            // 重新添加到队列中
            chunkList.push(chunkItem);
            handler();
          });
      }
      if (successCount >= totalChunks) {
        resolve();
      }
    };
    // handler()
    // 支持10个并发
    for (let i = 0; i < totalChunks; i++) {
      handler();
    }
  });
};

// const loadingUp = ref(true);

const loadingBtn=reactive({
  loading:false,
  buttonText:"提交"
})
const handleSubmitHomework = async () => {
  try {
    
    const valid = await upForm.value.validate();
    if (!valid) return;
    loadingBtn.loading=true
    const { data } = await checkAndUpload(loadMD5.md5);
    // console.log(data);

    let submitData = {
      homeworkId: upcontainer.homeworkId,
      studentId: user.userId,
      submissionPath: data,
      fileName: upfile.value.name,
      fileSize: upfile.value.size,
      fileType: upfile.value.type,
      feedback: upcontainer.feedback,
      fileMd5: loadMD5.md5,
      status: "1",
    };
    // console.log(submitData);
    submitHomework(submitData).then((res) => {
      console.log(res);
      loadingBtn.buttonText="还要继续起飞吗🛫"
    });
  } catch (e) {
    return;
  } finally {
    loadingBtn.loading=false
  }
};

onMounted(async () => {
  // console.log(user)
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
    margin-top: 8.5px;
    display: flex;
    justify-content: center;

    :deep(.el-select-dropdown__item) {
      padding: 0;
    }

    :deep(.el-upload-ui) {
      width: 100%;
    }
  }
}
</style>
