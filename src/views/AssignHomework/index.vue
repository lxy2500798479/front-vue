<template>
  <div class="container">
    <div class="createHomework">
      <el-form
        :model="homeworkForm"
        :rules="homeworkRules"
        ref="homeworkRef"
        label-width="70px"
      >
        <el-form-item label="作业标题" prop="title">
          <el-input
            v-model="homeworkForm.title"
            placeholder="请输入作业标题"
          ></el-input>
        </el-form-item>

        <el-form-item label="作业描述" prop="description">
          <el-input
            v-model="homeworkForm.description"
            type="textarea"
            placeholder="请输入作业描述"
          ></el-input>
        </el-form-item>

        <el-form-item label="截止日期" prop="dueDate">
          <el-date-picker
            v-model="homeworkForm.dueDate"
            type="datetime"
            placeholder="选择日期"
            style="width: 100%"
            format="YYYY/MM/DD HH:mm:ss"
          ></el-date-picker>
        </el-form-item>

        <el-form-item>
          <el-select v-model="classId" placeholder="请选择班级" multiple>
            <template #header>
              <el-checkbox
                v-model="checkAll"
                :indeterminate="indeterminate"
                @change="handleCheckAll"
              >
                全选
              </el-checkbox>
            </template>
            <el-option
              v-for="item in filterClass"
              :key="item.classId"
              :label="item.className"
              :value="item.classId"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-select
            v-model="homeworkForm.courseId"
            :placeholder="
              filterCourse.length === 1
                ? filterCourse[0].courseName
                : '请选择课程'
            "
            :disabled="filterCourse.length === 1"
          >
            <el-option
              v-for="item in filterCourse"
              :key="item.courseId"
              :label="item.courseName"
              :value="item.courseId"
            ></el-option>
          </el-select>
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

        <el-form-item>
          <el-button
            :loading="uploading"
            style="width: 100%"
            type="primary"
            @click="submitHomework"
            >发布</el-button
          >
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
import { reactive } from "vue";

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
const handleFileChange = async (file, fileList) => {
  console.log("改变了");
  // 假设你只关心最新的一个文件，因为你设置了 :limit="1"
  // fileList 是当前的文件列表，它应该包含了最新上传的文件
  const latestFile = fileList[fileList.length - 1];
  if (latestFile) {
    // 直接保存 File 对象
    upfile.value = latestFile.raw || latestFile; // 兼容性写法，确保是 File 对象

    let { hash } = await workmd5(upfile.value);
    // console.log(hash);
    checkExist(hash).then((res) => {
     if(res.data==null){

      // console.log(createFileChunk(upfile.value))
      let fileChunks = createFileChunk(upfile.value);
      let data = {
        fileName: upfile.value.name,
        partSize: fileChunks.length,
        contentType: upfile.value.type,
      };
      getPartUrl(data).then((res) => {
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
            fileName: file.name,
            uploadId: fileUploadId.value,
          };
          mergePart(par).then((res) => {
            console.log(res);
          });
        });
        
   
      });
    }else{
      ElMessage.success("文件已存在");
    }
    });

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

const slicePart = ref([]);

const checkslicePart = async () => {
  await getPartInfo({
    fileName: upfile.value.name,
    uploadId: fileUploadId.value,
  }).then((res) => {
    console.log(res);
    slicePart.value = res.data;
  });
};

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
  return new Promise((resolve, reject) => {
    const worker = new md5Worker();
    // console.log(file);
    worker.postMessage({ file });

    worker.onmessage = (event) => {
      resolve(event.data);
    };
    // worker.terminate();
  });
};

// /**
//  * 计算文件的MD5值，支持大文件分块计算。
//  * @param {File} file - 需要计算MD5的文件对象。
//  * @returns {Promise<string>} 返回一个Promise，解析后得到文件的MD5哈希值。
//  */
// const workmd5 = (file) => {
//   return new Promise((resolve, reject) => {
//     // 创建一个Web Worker实例来异步计算MD5
//     const worker = new md5Worker();
//     // 初始化一个FileReader对象用于读取文件内容
//     const fileReader = new FileReader();

//     // 设置分块大小为10MB
//     const chunkSize = 1024 * 1024 * 10;
//     let offset = 0; // 当前已读取文件的字节偏移量
//     // 计算文件需要分割的块数
//     const totalChunks = Math.ceil(file.size / chunkSize);
//     console.log("totalChunks", totalChunks); // 打印分块总数

//     // 用于存储每个分块的MD5值
//     const chunkMD5s = [];

//     // 文件读取完成的回调
//     fileReader.onload = (e) => {
//       // 向worker发送当前分块数据和其索引
//       worker.postMessage({ chunk: e.target.result, index: offset / chunkSize });
//       offset += chunkSize; // 更新偏移量
//       // 如果还有剩余未读取的部分，则继续读取下一块
//       if (offset < file.size) {
//         readNextChunk();
//       }
//     };

//     // 文件读取错误的回调
//     fileReader.onerror = (e) => {
//       // 发生错误时，拒绝Promise并返回错误信息
//       reject(e);
//     };

//     // 定义读取下一个文件块的函数
//     const readNextChunk = () => {
//       // 使用slice方法获取当前偏移量到下一个偏移量之间的文件片段
//       const chunk = file.slice(offset, offset + chunkSize);
//       // 开始读取该文件片段为ArrayBuffer类型
//       fileReader.readAsArrayBuffer(chunk);
//     };

//     // 开始读取第一个文件块
//     readNextChunk();

//     // 监听worker的消息，处理计算结果
//     worker.onmessage = (e) => {
//       // 如果消息类型为'md5'，说明整个文件的MD5已经计算完成
//       if (e.data.type === "md5") {
//         // 解析Promise并返回最终的MD5哈希值
//         resolve(e.data);
//       } else {
//         // 否则，收集分块的MD5值
//         chunkMD5s.push(e.data);
//         // 当所有分块的MD5值都收集完毕时，通知worker进行合并操作
//         if (chunkMD5s.length === totalChunks) {
//           worker.postMessage({ type: "combine", chunkMD5s });
//         }
//       }
//     };
//   });
// };

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

    const homeworkClassBO = {
      homeworks: { ...homeworkForm },
      classId: classId.value ? classId.value : [],
    };

    let formData = new FormData();
    if (upfile.value) formData.append("file", upfile.value);
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
