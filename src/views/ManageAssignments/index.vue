<!--
 * @Author: 星忆 2500798479@qq.com
 * @Date: 2024-04-14 01:19:30
 * @LastEditors: 星忆 2500798479@qq.com
 * @LastEditTime: 2024-04-16 21:50:28
 * @FilePath: \up-cloud-front\src\views\ManageAssignments\index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="ManageContainer">
    <div class="homework-list">
      <div
        class="homework-item"
        v-for="(item, index) in homeworkList"
        :key="index"
        @click="selectItem(index)"
      >
        <div class="homeleft">
          <!-- <span class="title">{{ item.title.substring(0,15)+'...' }}</span> -->

          <template v-if="isLongText(item.title)">
            <el-popover
              placement="right"
              :width="200"
              trigger="hover"
              :content="item.title"
            >
              <template #reference>
                <span class="title">{{
                  item.title.substring(0, 8) + '...'
                }}</span>
              </template>
            </el-popover>
          </template>
          <span v-else class="title">{{ item.title }}</span>
          <template v-if="isLongText(item.description)">
            <el-popover
              placement="right"
              :width="200"
              trigger="hover"
              :content="item.description"
            >
              <template #reference>
                <span class="description">{{
                  item.description.substring(0, 15) + '...'
                }}</span>
              </template>
            </el-popover>
          </template>
          <span v-else class="description">{{ item.description }}</span>
          <span class="due_date"
            >截止日期：{{ formatDate(item.due_date) }}</span
          >
        </div>
        <div class="homeright">
          <span
            class="className"
            v-for="className in item.classesList"
            :key="className.classId"
            >{{ className.className }}</span
          >
        </div>
      </div>
    </div>

    <div class="homework-info">123</div>
  </div>
</template>

<script setup>
import { findteacherPublicHomework } from '@/api/teacher'
import { useUserStore } from '@/store/user'

const homeworkList = ref([])
const loading = ref(false)
const { user } = useUserStore()

const selectedItem = ref(0) // 默认选中第一个项目
// 方法用于更新选中的项目
const selectItem = (index) => {
  selectedItem.value = index;
  nextTick(() => {
    const listContainer = document.querySelector('.homework-list');
    const itemCenter = itemCenterPosition(index);
    const scrollToPosition = itemCenter - listContainer.clientHeight / 2;
    listContainer.scrollTo({ top: scrollToPosition, behavior: 'smooth' });
  });
};


const itemCenterPosition = (index) => {
  const itemHeight = 110;
  const marginTop = 20;
  return itemHeight * index + marginTop * index + itemHeight / 2;
};



const isLongText = (text, length = 30) => {
  return text.length > length
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}



const top = computed(() => {
  const baseHeight = 110; // 每个项目的高度
  const marginTop = 20;   // 第二个及之后项目的上边距
  const initialOffset = (baseHeight+20) / 2; // 第一个项目三角形居中位置

  if (selectedItem.value === 0) {
    // 如果是第一个项目，三角形直接位于项目高度的一半
    return `${initialOffset}px`;
  } else {
    // 如果不是第一个项目，计算包含上边距的完整高度偏移
    return `${initialOffset + (baseHeight + marginTop) * selectedItem.value}px`;
  }
});

onMounted(async () => {
  loading.value = true
  const res = await findteacherPublicHomework(user.userId)
  homeworkList.value = res.data
  homeworkList.value = res.data

  console.log(homeworkList.value)
  loading.value = false
  // mount.value = true
})
</script>

<style lang="scss" scoped>
.ManageContainer {
  display: flex;

  height: 100%;

  .homework-list {
    // scroll-behavior: smooth;
    position: relative;
    width: 320px;
    margin-right: 50px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::after {
      content: '';
      width: 0;
      height: 0;
      position: absolute;
      top: v-bind(top);
      transform: translateY(-100%);
      right: 5.5px;
      border-top: 10px solid transparent; /* 上边透明 */
      border-bottom: 10px solid transparent; /* 下边透明 */
      border-left: 15px solid red; /* 左边红色 */
      transition: all 0.5s ease-in;
    }

    &::-webkit-scrollbar {
      display: none;
    }

    .homework-item {
      flex-shrink: 0;
      width: 300px;
      position: relative; // 确保可以相对定位三角形
      display: flex;
      justify-content: space-around;
      padding: 6px 8px 0 8px;

      height: 110px;
      background-color: rgb(222, 174, 174);
      border-radius: 10px;

      &:not(:first-child) {
        margin-top: 20px; // 为除第一个外的其他元素设置上边距
      }

      .homeleft,
      .homeright {
        display: flex;
        flex-direction: column;
      }

      .homeleft {
        margin-right: 8px;
        flex-grow: 1;
        justify-content: space-around;
        overflow: hidden;
        & > span {
          display: block;
          width: 100%;
          overflow: hidden;
          //text-overflow: ellipsis;
          white-space: nowrap;
        }
        .title {
          font-size: 23px;
          color: #000000;
        }

        .description {
          font-size: 14px;
          color: #fff;
        }

        .due_date {
          font-size: 14px;
          color: #ef0f0f;
        }
      }

      .homeright {
        flex-shrink: 0;
        .className {
          text-align: center;
          font-size: 13px;
          color: #fff;
        }
      }
    }
  }

  .homework-info {
    flex-grow: 1;
    // width: 75%;
    padding: 20px;
    border-radius: 10px;
    background-color: #fff;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    color: #333;
  }
}
</style>
