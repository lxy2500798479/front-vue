<template>
  <div class="container">
    <div class="createHomework">
      <el-form :model="homeworkForm" :rules="homeworkRules" ref="homeworkRef" label-width="70px">
        <el-form-item label="作业标题" prop="title">
          <el-input v-model="homeworkForm.title" placeholder="请输入作业标题"></el-input>
        </el-form-item>

        <el-form-item label="作业描述" prop="description">
          <el-input v-model="homeworkForm.description" type="textarea" placeholder="请输入作业描述"></el-input>
        </el-form-item>

        <el-form-item label="截止日期" prop="dueDate">
          <el-date-picker v-model="homeworkForm.dueDate" type="datetime" placeholder="选择日期" style="width: 100%"
            format="YYYY/MM/DD HH:mm:ss"></el-date-picker>
        </el-form-item>

        <el-form-item>
          <el-select v-model="classId" placeholder="请选择班级" multiple>
            <template #header>
              <el-checkbox v-model="checkAll" :indeterminate="indeterminate" @change="handleCheckAll">
                全选
              </el-checkbox>
            </template>
            <el-option v-for="item in filterClass" :key="item.classId" :label="item.className"
              :value="item.classId"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-select v-model="homeworkForm.courseId" :placeholder="filterCourse.length === 1
            ? filterCourse[0].courseName
            : '请选择课程'
            " :disabled="filterCourse.length === 1">
            <el-option v-for="item in filterCourse" :key="item.courseId" :label="item.courseName"
              :value="item.courseId"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-upload ref="fileRef" :auto-upload="false" list-type="text" class="el-upload-ui" drag :limit="1"
            :on-exceed="handleExceed" :on-change="handleFileChange" :before-remove="handleRemove">
            <el-icon class="el-icon--upload"><upload-filled style="font-size: 50px" /></el-icon>
            <div class="el-upload__text">
              （选择上传）将文件拖到此处，或<em>点击上传</em>
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button :loading="uploading" style="width: 100%" type="primary" @click="submitHomework"
            :disabled="loadMD5.isLoading">发布</el-button>
          <!-- <el-button style="width: 100%" @click="isPaused = !isPaused">
            {{ isPaused ? "继续" : "暂停" }}
          </el-button>
          <el-button style="width: 100%" @click="checkslicePart"
            >查看分片</el-button
          >
          <span>{{ slicePart }}</span> -->
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from "@/store/user";
import { findClassesCourseByUserId, createHomework } from "@/api/teacher";
import { checkExist, getPartUrl, mergePart, getPartInfo } from "@/api/file";
import { toast } from "@/utils/message";
import md5Worker from "@/utils/md5Worker.js?worker";
import { reactive, ref } from "vue";

import axios from "axios";
import { ElMessage } from "element-plus";

const { user } = useUserStore();

const uploading = ref(false);

const fileRef = ref(null);
const upfile = ref(null);

// const isExistForm = reactive({
//   md5: "",
//   isExist: false,
//   donwload_url: "",
// });

const fileUploadId = ref(null);
const checkAll = ref(false);
const homeworkRef = ref(null);
const homeworkForm = reactive({
  title: "",
  description: "",
  dueDate: "",
  teacherId: `${user.userId}`,
  courseId: "",
  fileMd5: '',
  downloadUrl: "",
  fileSize: '',
  fileType: '',
  fileName: ''
});
const classId = ref([]);

const indeterminate = computed(
  () =>
    classId.value.length > 0 && classId.value.length < filterClass.value.length
);

const handleCheckAll = (val) => {
  classId.value = val ? filterClass.value.map((item) => item.classId) : [];
};
const handleRemove = (file, fileList) => {
  upfile.value = null;
};
const handleExceed = (files) => {
  fileRef.value.clearFiles();
  const newFile = files[0]; // 修改变量名以避免与外部的 ref 变量冲突
  fileRef.value.handleStart(newFile); // 使用新的变量名
};

const homeworkRules = {
  title: [{ required: true, message: "请输入作业标题", trigger: "submit" }],
  description: [
    { required: true, message: "请输入作业描述", trigger: "submit" },
  ],
  dueDate: [{ required: true, message: "请选择截止日期", trigger: "submit" }],
  teacherId: [{ required: true, message: "请输入教师ID", trigger: "submit" }],
};


const loadMD5 = reactive({
  isLoading: false,
  md5: '',
  worker: null
})

const handleFileChange = async (file, fileList) => {
  console.log("改变了");
  // 假设你只关心最新的一个文件，因为你设置了 :limit="1"
  // fileList 是当前的文件列表，它应该包含了最新上传的文件
  const latestFile = fileList[fileList.length - 1];
  if (latestFile) {
    // 直接保存 File 对象
    upfile.value = latestFile.raw || latestFile; // 兼容性写法，确保是 File 对象
    console.log(upfile.value);



    let { md5, worker } = await workmd5(upfile.value);
    loadMD5.md5 = md5.hash
    loadMD5.worker = worker
    // console.log(worker);

    // console.log(hash);

    // workmd5(upfile.value).then((md5) => {
    //   isExistForm.md5 = md5;
    //   checkExist(isExistForm.md5).then((res) => {
    //     if (res.data == null) {
    //       isExistForm.isExist = false;
    //     } else {
    //       isExistForm.isExist = true;
    //       isExistForm.donwload_url = res.data
    //     }
    //   });
    // });
  }
};

const checkAndUpload = (md5) => {
  console.log(md5);
  return new Promise((resolve, reject) => {
    checkExist(md5).then((res) => {
      if (res.data == null) {
        loadMD5.worker.terminate();

        // let fileSp = upfile.value.name.split('.');
        // let fileName =
        //   fileSp.length > 1
        //     ? `${fileSp[0]}_${md5}.${fileSp[fileSp.length-1]}`
        //     : `${fileSp[0]}_${md5}`;

    
        let fileName = upfile.value.name;
        let dotIndex = fileName.lastIndexOf('.'); // 找到最后一个点的位置
        let fileNameWithoutExt = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
        let fileExt = dotIndex !== -1 ? fileName.substring(dotIndex + 1) : '';

        let finalFileName =
          fileExt
            ? `${fileNameWithoutExt}_${md5}.${fileExt}`
            : `${fileNameWithoutExt}_${md5}`;

        // URL编码文件名
        let encodedFileName = encodeURIComponent(finalFileName);
        let fileChunks = createFileChunk(upfile.value);
        console.log(encodedFileName);
        let data = {
          fileName:encodedFileName,
          partSize: fileChunks.length,
          contentType: upfile.value.type,
        };

        
        getPartUrl(data).then((res) => {
          console.log(res);
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
        // 如果不满足条件，执行 checkExist(md5.hash)，并将结果传递给外部
        resolve(res);
      }
    }).catch((error) => {
      reject(error); // 处理错误情况
    });
  });
};



// const slicePart = ref([]);

// const checkslicePart = async () => {
//   await getPartInfo({
//     fileName: upfile.value.name,
//     uploadId: fileUploadId.value,
//   }).then((res) => {
//     console.log(res);
//     slicePart.value = res.data;
//   });
// };

const isPaused = ref(false);





//分片上传
const uploadChunkBase = async (
  chunkList,
  contentType = "application/octet-stream"
) => {
  let successCount = 0;
  let totalChunks = chunkList.length;
  return new Promise((resolve, reject) => {
    const handler = () => {
      if (chunkList.length && !isPaused.value) {
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


              handler()
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

const workmd5 = async (file) => {
  loadMD5.isLoading = true
  return new Promise((resolve, reject) => {
    const worker = new md5Worker();
    // console.log(file);
    worker.postMessage({ file });

    worker.onmessage = (event) => {
      loadMD5.isLoading = false
      // console.log(event.data);
      resolve({ md5: event.data, worker }); // 返回 MD5 值和 Worker 实例
    };
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

const submitHomework = async () => {
  uploading.value = true;

  try {
    const valid = await homeworkRef.value.validate();
    if (!valid) return;

    const { data } = await checkAndUpload(loadMD5.md5)
    homeworkForm.fileMd5 = loadMD5.md5
    homeworkForm.downloadUrl = data
    homeworkForm.fileName = upfile.value.name
    homeworkForm.fileSize = upfile.value.size
    homeworkForm.fileType = upfile.value.type

    const homeworkClassBO = {
      homeworks: { ...homeworkForm },
      classId: classId.value ? classId.value : [],
    };

    let formData = new FormData();
    // if (upfile.value) formData.append("file", upfile.value);
    formData.append("homework", JSON.stringify(homeworkClassBO));

    // 发送 formData 到服务器
    const res = await createHomework(formData);

    if (res.code == 200) {
      homeworkRef.value.resetFields();
      fileRef.value.clearFiles();
      classId.value = [];
      toast(res.msg, "发布成功");
    } else {
      toast(res.msg, "发布失败", "error");
    }
  } catch (error) {
    // toast('error', '发布失败');
    toast("error", "请输入完整", "error");
  } finally {
    uploading.value = false;
  }
};

let classesCourse = ref([]);
const filterClass = computed(() =>
  classesCourse.value.map((item) => item.classes)
);
const filterCourse = computed(() =>
  Array.from(
    new Set(classesCourse.value.map((item) => JSON.stringify(item.courses)))
  ).map((courseStr) => JSON.parse(courseStr))
);

onMounted(async () => {
  const res = await findClassesCourseByUserId(user.userId);
  classesCourse.value = res.data;
  const courses = filterCourse.value;
  if (courses.length === 1) {
    homeworkForm.courseId = courses[0].courseId;
  }
});
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  justify-content: space-around;
  background-color: rgba(111, 107, 113, 0.3);
  border-radius: 8px;
  padding: 40px;
  height: 100vh;

  .createHomework {
    background-color: #ffffff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    padding: 20px;
    width: 100%;
    margin-top: 20px;

    display: flex;
    flex-direction: column;
  }
}

.el-input,
.el-select,
.el-date-picker {
  width: 100%;
}

:deep(.el-upload-ui) {
  flex-grow: 1;

  .el-upload-list__item-name {
    justify-content: center;
  }
}
</style>
