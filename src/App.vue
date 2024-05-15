<!--
 * @Author: 星忆 2500798479@qq.com
 * @Date: 2024-04-14 01:19:30
 * @LastEditors: 星忆 2500798479@qq.com
 * @LastEditTime: 2024-04-15 22:19:40
 * @FilePath: \up-cloud-front\src\App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div id="g-pointer"></div>

  <router-view></router-view>
</template>

<script setup>

const isPointerVisible = ref(true);

onMounted(()=>{
  const body = document.querySelector("body");
  const element = document.getElementById("g-pointer");
  const halfWidth = element.offsetWidth / 2;

  function setPosition(x, y) {
    element.style.transform = `translate(${x-halfWidth+2}px, ${
      y - halfWidth +2
    }px)`;
  }

  body.addEventListener("mousemove", (e) => {
    window.requestAnimationFrame(function () {
      setPosition(e.clientX, e.clientY);
    });
  });

  document.body.addEventListener("mouseenter", () => {
  isPointerVisible.value = true;
  // 添加动画效果
  element.style.display = "block";
  setTimeout(() => {
    element.style.opacity = "1";
  }, 50);
});

  body.addEventListener("mouseleave",()=>{
    isPointerVisible.value = false;
    element.style.display = 'none';
  })
})
</script>

<style scoped lang="scss">
  
  #g-pointer {
    z-index: 999;
    position: absolute;
    top: 0;
    left: 0;
    width: 18px;
    height: 18px;
    transition: 0.05s linear;
    pointer-events: none;
    // background: #ffffff40;
    background: rgba(0,0,0,.1);
    border-radius: 50%;
    z-index: 9999999;
  }
</style>
