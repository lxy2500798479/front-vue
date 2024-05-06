<!--
 * @Author: 星忆 2500798479@qq.com
 * @Date: 2024-04-14 01:19:30
 * @LastEditors: 星忆 2500798479@qq.com
 * @LastEditTime: 2024-04-27 10:52:22
 * @FilePath: \up-cloud-front\src\views\SubmitHomework\index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
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
                  item.title.substring(0, 15) + '...'
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
                <el-button @click="downloadFile">下载</el-button>
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
import dayjs from 'dayjs'
import { findStudentHomework,downloadFile } from '@/api/student'
import { useUserStore } from '@/store/user'

const { user } = useUserStore()

let homeworklist = ref([])

onMounted(async () => {
  const res = await findStudentHomework(user.classId)
  homeworklist.value = res.data
  homeworklist.value.forEach((item) => {
    item.dueDate = dayjs(item.dueDate).format('YYYY-MM-DD HH:mm:ss')
  })
  console.log(homeworklist.value)
})


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
          font-family: 'myFont', sans-serif;

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
