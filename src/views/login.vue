<template>
  <div class="loginwapper">
    <div class="content">
      <div class="left">
        <img
          ref="people"
          src="../assets/images/img2.png"
          class="people p-animtion p-other-animation"
          alt="people"
        />
        <img
          ref="sphere"
          src="../assets/images/img1.png"
          class="sphere s-animtion s-other-animation"
          alt="sphere"
        />
      </div>
      <div class="right">
        <div class="top">
          <img src="@/assets/images/QQ.png" alt="" />
          <p>欢迎使用</p>
        </div>
        <div class="formwapper">
          <!-- <input type="text" class="inputs user" v-model="loginForm.username" placeholder="账号">
                    <input type="password" class="inputs pwd" v-model="loginForm.password" placeholder="密码"> -->
          <el-form ref="ruleFormRef" :rules="loginRules" :model="loginForm">
            <el-form-item prop="username">
              <el-input
                placeholder="账号"
                clearable
                v-model="loginForm.username"
                class="elinput"
              >
                <template #prefix>
                  <el-icon>
                    <User />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                type="password"
                placeholder="密码"
                clearable
                v-model="loginForm.password"
                show-password
                class="elinput"
              >
                <template #prefix>
                  <el-icon>
                    <Lock />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
          <div class="tip">
            <el-checkbox
              class="check"
              v-model="loginForm.rememberMe"
              label="记住我"
              size="large"
            />
            <span>忘记密码?</span>
          </div>
          <el-button
            :loading="loading"
            type="primary"
            @click="submitForm"
            size="large"
            style="margin-top: 10px"
            >登录
          </el-button>
        </div>

        <div class="dayone" @click="initDayOne">
          <el-popover
            class="item custom-tooltip"
            width="375px"
            v-if="oneDay.origin.content && oneDay.origin.content.length > 0"
            :content="oneDay.origin.content.join(',')"
            placement="top-start"
            effect="light"
          >
            <template #reference>
              <div style="text-align: right">
                <span>{{ oneDay.content }}</span>
                <br />
                <span style="float: right; padding-top: 8px"
                  >——{{ oneDay.origin.author }}</span
                >
              </div>
            </template>
          </el-popover>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { load } from "jinrishici";

import { useRouter } from "vue-router";

import { login, getUserInfo } from "@/api/user";

import { useUserStore } from "@/store/user.js";

import { User, Lock } from "@element-plus/icons-vue";

import Cookies from "js-cookie";

const router = useRouter();

const userStore = useUserStore();

const loading = ref(false);

//登录表单
const loginForm = reactive({
  username: "",
  password: "",
  accountType: "",
  rememberMe: true,
});

const ruleFormRef = ref(null);
const loginRules = {
  username: [
    { required: true, message: "请输入账号", trigger: "blur" },
    { min: 5, max: 20, message: "长度在 5 到 20 个字符", trigger: "submit" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 5, max: 20, message: "长度在 5 到 20 个字符", trigger: "submit" },
  ],
};

function rememberCount() {
  if (loginForm.rememberMe) {
    Cookies.set("username", loginForm.username, { expires: expiredTime(7) });
    Cookies.set("password", loginForm.password, { expires: expiredTime(7) });
  } else {
    Cookies.remove("username");
    Cookies.remove("password");
  }
}

function initForm() {
  const username = Cookies.get("username");
  const password = Cookies.get("password");
  if (username && password) {
    loginForm.username = username.toString();
    loginForm.password = password.toString();
    loginForm.rememberMe = true;
  }
}

function judgeAccountType(account) {
  const studentPattern = /^\d{13}$/;
  const teacherPattern = /^[a-zA-Z]+\d+$/;

  if (studentPattern.test(account)) {
    return "student";
  } else if (teacherPattern.test(account)) {
    return "teacher";
  } else {
    return "admin";
  }
}

const submitForm = async () => {
  loginForm.accountType = judgeAccountType(loginForm.username);
  await ruleFormRef.value.validate((valid) => {
    // console.log(valid);
    if (valid) {
      Login();
    } else {
      // console.log('error submit!!');
      // loginNotice.value = { code: 400, msg: '请输入账号或密码' }
    
    }
  });
};

const expiredTime = (days) => {
  let date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  return date;
};

/**
 * Login 函数用于处理用户登录操作。
 * 
 * 函数首先将 loading 状态设置为 true，表示开始进行异步操作。
 * 然后，函数尝试调用 login 函数进行登录，并将结果保存在 res 中。
 * 如果登录成功（即 res.code 为 200 并且 res.msg 为 "success"），则将 token 和 refresh_token 保存在 Cookies 中，
 * 并尝试获取用户信息。如果获取用户信息成功，则将用户信息保存在 userStore 中，并跳转到 dashboard 页面。
 * 如果登录失败或获取用户信息失败，则弹出提示信息。
 * 
 * 无论异步操作是否成功，函数最后都会将 loading 状态设置为 false，表示异步操作结束。
 * 
 * @async
 * @function Login
 * @throws {Error} 如果登录或获取用户信息的过程中出现错误，函数会抛出错误。
 */
const Login = async () => {
  loading.value = true; // 在异步操作开始前，设置 loading 为 true
  try {
    const res = await login(loginForm);
    // console.log(res);

    Cookies.set("token", res.data.token, { expires: expiredTime(1) });
    Cookies.set("refresh_token", res.data.refreshToken, {
      expires: expiredTime(7),
    });

    if (res.code == 200 && res.msg == "success") {
      rememberCount();

      const userInfo = await getUserInfo(loginForm.username);
      if (userInfo.code == 200) {
        // addDynamicRoutes(userInfo.data.menus)

        userStore.setUser(userInfo.data);
      } else {
        console.log("获取用户信息失败");
      }

      await router.push("/dashboard");
    } else {
      alert("账号或密码错误");
    }
  } catch (error) {
    // 处理异步操作出错的情况
    loading.value = false; // 无论异步操作成功或失败，都在最终设置 loading 为 false
  } finally {
    loading.value = false; // 无论异步操作成功或失败，都在最终设置 loading 为 false
  }
};

//监听回车键
const keyEnterLogin = (e) => {
  document.onkeydown = function (e) {
    let ev = document.all ? window.event : e;
    if (ev.keyCode == 13) {
      submitForm();
    }
  };
};

// 获取每日一句
const oneDay = reactive({ content: "", origin: { content: [] } });
const initDayOne = () => {
  load((res) => {
    if ((res.status == "success")) {
      // console.log(res.data);
      oneDay.content = res.data.content;
      oneDay.origin = res.data.origin;
      // console.log(oneDay);
    } else {
      oneDay.content = "接口跑路喽";
    }
  });

  keyEnterLogin();
};

onMounted(async () => {
  initDayOne();

  initForm();
});

nextTick(() => {
  document
    .querySelector(".people")
    .addEventListener("animationend", function () {
      this.classList.remove("p-animtion");
      this.classList.add("p-other-animtion");
    });
  document
    .querySelector(".sphere")
    .addEventListener("animationend", function () {
      this.classList.remove("s-animtion");
      this.classList.add("s-other-animtion");
    });
});
</script>

<style lang="scss" scoped>
.loginwapper {
  user-select: none;
  margin: 0;
  min-height: 100vh;
  background-color: #abc6f8;
  background-image: radial-gradient(
      closest-side,
      rgb(255, 255, 255),
      rgba(235, 105, 78, 0)
    ),
    radial-gradient(closest-side, rgb(250, 203, 203), rgba(243, 11, 164, 0)),
    radial-gradient(closest-side, rgb(237, 252, 202), rgba(254, 234, 131, 0)),
    radial-gradient(closest-side, rgb(197, 248, 241), rgba(170, 142, 245, 0)),
    radial-gradient(closest-side, rgb(206, 200, 243), rgba(248, 192, 147, 0));
  background-size: 130vmax 130vmax, 80vmax 80vmax, 90vmax 90vmax,
    110vmax 110vmax, 90vmax 90vmax;
  background-position: -80vmax -80vmax, 60vmax -30vmax, 10vmax 10vmax,
    -30vmax -10vmax, 50vmax 50vmax;
  background-repeat: no-repeat;
  animation: 10s movement linear infinite;

  &::after {
    content: "";
    display: block;
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  overflow: hidden;

  .content {
    width: 90vw;
    height: 90vh;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.18);
    display: flex;

    .left {
      flex: 1;
      position: relative;

      .people {
        position: absolute;
        left: -50%;
        top: 20%;
        width: 70%;
        // height: 100px;
        z-index: 2;
      }

      .p-animtion {
        animation: peopleAnimation 2s;
        animation-fill-mode: forwards;
        animation-timing-function: ease;
      }

      .p-other-animtion {
        animation-name: pOtherAnimation; // 动画名称
        animation-direction: alternate; // 动画在奇数次（1、3、5...）正向播放，在偶数次（2、4、6...）反向播放。
        animation-timing-function: linear; // 动画执行方式，linear：匀速；ease：先慢再快后慢；ease-in：由慢速开始；ease-out：由慢速结束；ease-in-out：由慢速开始和结束；
        animation-iteration-count: infinite; //  动画播放次数，infinite：一直播放
        animation-duration: 3s; // 动画完成时间
      }

      .sphere {
        position: absolute;
        left: 30%;
        width: 90%;
        z-index: 1;
        animation: sphereAnimation 2s;
        animation-fill-mode: forwards;
        animation-timing-function: ease;
      }

      .s-animtion {
        animation: sphereAnimation 2s;
        animation-fill-mode: forwards;
        animation-timing-function: ease;
      }

      .s-other-animtion {
        animation-name: sOtherAnimation; // 动画名称
        animation-direction: alternate; // 动画在奇数次（1、3、5...）正向播放，在偶数次（2、4、6...）反向播放。
        animation-timing-function: linear; // 动画执行方式，linear：匀速；ease：先慢再快后慢；ease-in：由慢速开始；ease-out：由慢速结束；ease-in-out：由慢速开始和结束；
        animation-iteration-count: infinite; //  动画播放次数，infinite：一直播放
        animation-duration: 3s; // 动画完成时间
      }
    }

    .right {
      flex: 1;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;

      .top {
        img {
          width: 100px;
          height: 100px;
          border-radius: 50%;
        }

        p {
          font-size: 30px;
          font-weight: bold;
        }
      }

      .formwapper {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 50%;

        .el-button {
          width: 85%;
        }

        .inputs {
          display: block;
          height: 60px;
          width: 100%;
          margin: 20px 0;
          border-radius: 10px;
          border: 0;
          background-color: rgb(210 223 237);
          color: rgb(80, 82, 84);
          // font-family: "Century Gothic", Times, serif;
          outline: none;
          padding: 28px;
          box-sizing: border-box;
          font-size: 18px;
          font-weight: 600;
          caret-color: blue;
        }

        .elinput {
          width: 300px;
          height: 43px;
          line-height: 43px;
          margin-top: 10px;
        }

        .tip {
          color: rgb(160, 170, 182);
          display: flex;
          justify-content: space-around;
          align-items: center;
          width: 100%;

          span {
            cursor: pointer;
          }
        }
      }

      .dayone {
        // height: 40px;
        position: absolute;
        bottom: 35px;
        font-size: 14px;
        color: rgb(129, 137, 148);
        cursor: pointer;
      }
    }
  }
}

/* 在小屏幕上将内容堆叠在一起 */
@media (max-width: 768px) {
  .loginwapper {
    width: 100vw;
    height: 100vh;

    .content {
      width: 90%;
      height: 90%;

      .left {
        display: none;
      }

      .right {
        display: flex;
        width: 100%;
        height: 90vh;

        .top {
          p {
            text-align: center;
            font-size: 30px;
            font-weight: 800;
            color: #abc6f8;
          }
        }

        .formwapper {
          width: 60%;

          .inputs {
            width: 225px;
            margin: 15px 0;
          }

          .tip {
            width: 100%;
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            color: #abc6f8;
            margin-bottom: 8px;
          }
        }
      }
    }
  }
}

@keyframes movement {
  0%,
  100% {
    background-size: 130vmax 130vmax, 80vmax 80vmax, 90vmax 90vmax,
      110vmax 110vmax, 90vmax 90vmax;
    background-position: -80vmax -80vmax, 60vmax -30vmax, 10vmax 10vmax,
      -30vmax -10vmax, 50vmax 50vmax;
  }

  25% {
    background-size: 100vmax 100vmax, 90vmax 90vmax, 100vmax 100vmax,
      90vmax 90vmax, 60vmax 60vmax;
    background-position: -60vmax -90vmax, 50vmax -40vmax, 0vmax -20vmax,
      -40vmax -20vmax, 40vmax 60vmax;
  }

  50% {
    background-size: 80vmax 80vmax, 110vmax 110vmax, 80vmax 80vmax,
      60vmax 60vmax, 80vmax 80vmax;
    background-position: -50vmax -70vmax, 40vmax -30vmax, 10vmax 0vmax,
      20vmax 10vmax, 30vmax 70vmax;
  }

  75% {
    background-size: 90vmax 90vmax, 90vmax 90vmax, 100vmax 100vmax,
      90vmax 90vmax, 70vmax 70vmax;
    background-position: -50vmax -40vmax, 50vmax -30vmax, 20vmax 0vmax,
      -10vmax 10vmax, 40vmax 60vmax;
  }
}

@keyframes sphereAnimation {
  0% {
    width: 10%;
  }

  100% {
    width: 90%;
    transform: translate(-30%, 5%);
  }
}

@keyframes peopleAnimation {
  0% {
    width: 40%;
  }

  100% {
    width: 70%;
    transform: translate(90%, -10%);
  }
}

@keyframes pOtherAnimation {
  0% {
    transform: translate(90%, -10%);
  }

  100% {
    transform: translate(90%, -15%);
  }
}

@keyframes sOtherAnimation {
  0% {
    transform: translate(-30%, 2%);
  }

  100% {
    transform: translate(-30%, 6%);
  }
}
</style>
