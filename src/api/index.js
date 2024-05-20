import axios from "axios";

import { start, done } from "nprogress";
import { toast } from "@/utils/message";

import Cookies from "js-cookie";
import { ref } from "vue";

const dev_url = "/api";

const prod_url = "http://localhost:8500";

const service = axios.create({
  baseURL: dev_url,
  timeout: 50000,
});


service.interceptors.request.use(
  start(),
  (config) => {
    const token = Cookies.get("token");

    // config.headers("Access-Control-Allow-Origin","*")
    if (token) {

      config.headers.Cookie = token;

    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

service.interceptors.response.use(
  (response) => {

    // console.log(response);

  

    // 如果响应数据是 Blob 对象，则直接返回
    if (response.data instanceof Blob) {
      // console.log(response);

      return response;
    }

    // 否则，继续执行后续逻辑
    // console.log(response);
    if (response.data.code == 200) {
   
      return response.data;

    }
    done();

    // toast(response.data.msg, "error");
    toast("error", response.data.msg, "error");
    return Promise.reject(response.data);
  },

  (error) => {

    if(axios.isCancel(error)){
      return
    }
   
    // console.log(error);
    done();

    toast("error", error, "error");
    return Promise.reject(error);
  }
);


export default service;
