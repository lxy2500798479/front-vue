import service from ".";


const checkExist = (md5) => {
    return service.get(`/homework/checkExistByMd5?md5=${md5}`);
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

export { checkExist ,getPartUrl,mergePart,getPartInfo};