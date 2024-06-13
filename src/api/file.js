import service from ".";


const checkExist = (md5,utype) => {
    return service.get(`/homework/checkExistByMd5?md5=${md5}&Utype=${utype}`);
}


const getPartUrl=(data) => {
    return service.get(`/homework/partUrl`,{params:data});
}

const mergePart=(data) => {
    return service.get(`/homework/mergePart`,{params:data});
}

const getPartInfo=(data) => {
    return service.get(`/homework/partInfo`,{params:data});
}

const downloadFile=(data,onDownloadProgress,cancelToken,headers) => {
    return service.get(`/homework/download`,{params:data,responseType:'blob',onDownloadProgress,cancelToken,headers});
}


export { checkExist ,getPartUrl,mergePart,getPartInfo,downloadFile};