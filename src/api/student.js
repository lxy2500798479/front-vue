/*
 * @Author: 星忆 2500798479@qq.com
 * @Date: 2024-04-17 00:38:17
 * @LastEditors: 星忆 2500798479@qq.com
 * @LastEditTime: 2024-04-27 11:27:41
 * @FilePath: \up-cloud-front\src\api\student.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import service from '.'

const findStudentHomework = (data) => {
  return service.get(`/homework/studentHomework/classId=${data}`)
}

// const downloadFile=(teacherId,homeworkId)=>{
//   return service.post(`/homework/getFile`,{responseType: 'blob',headers: {'Content-Type': 'application/json'}})
// }

const downloadFile=({onDownloadProgress })=>{
 return service.get(`/homework/getFile`,{responseType: 'blob',headers:"Content-Type:application/json",onDownloadProgress: onDownloadProgress })

}


const stopDownloadFile=()=>{
  return service.post(`/homework/stopDownload`)
}


export { findStudentHomework ,downloadFile,stopDownloadFile}