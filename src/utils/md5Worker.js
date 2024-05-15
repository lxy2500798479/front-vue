import SparkMD5 from 'spark-md5';

// self.onmessage = function(event) {
//   const { type, chunk, index, chunkMD5s } = event.data;
//   if (type === 'combine') {
//     const combinedHash = combineHashes(chunkMD5s);
//     self.postMessage({ type: 'md5', hash: combinedHash });
//   } else {
//     const spark = new SparkMD5.ArrayBuffer();
//     spark.append(chunk);
//     const hash = spark.end();
//     self.postMessage({ type: 'hash', index, hash });
//   }
// };


self.onmessage = async (event) => {
  const startTime=Date.now();
  // console.log('event',event);
  const selectFile = event.data.file;
  const result = await computeMD5(selectFile);
  // console.log('result',result);
  self.postMessage(result);
console.log('用时秒',(Date.now()-startTime)/1000);
};

const computeMD5 = (file) => {
  return new Promise((resolve, reject) => {
    const chunkSize = 1024 * 1024 * 100;
    let offset = 0;
    // const totalChunks = Math.ceil(file.size / chunkSize);
    const chunkMD5s = [];
    const fileReader = new FileReader();

    fileReader.onload = () => {
      const spark = new SparkMD5.ArrayBuffer();
      spark.append(fileReader.result);
      const hash = spark.end();
      chunkMD5s.push(hash);

      offset += chunkSize;
      if (offset < file.size) {
        readNextChunk();
      } else {
        const combinedHash = combineHashes(chunkMD5s);
        resolve({ type: 'md5', hash: combinedHash });
      }
    };

    fileReader.onerror = (error) => {
      reject(error);
    };

    const readNextChunk = () => {
      const chunk = file.slice(offset, offset + chunkSize);
      fileReader.readAsArrayBuffer(chunk);
    };

    readNextChunk();
  });
};


const combineHashes = (hashes) => {
  const spark = new SparkMD5();
  for (let i = 0; i < hashes.length; i++) {
    spark.append(hashes[i]);
  }
  return spark.end();
};
