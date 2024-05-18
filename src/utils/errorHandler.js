

const wrapWidthTryCatch=(fn)=>{
    return function(){
        try{
            const result=fn.apply(this,arguments);
            if(result instanceof Promise){
                return result.catch(e=>{
                    console.error(e);
                    throw e;
                })
            }
            return result;
        }catch(e){
            console.error(e);
            throw e;
        }
    }
}

export default wrapWidthTryCatch;