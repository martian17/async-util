//util functions
const Events = function(){
    const eventTable = {};
    this.eventTable = eventTable;
    this.table = eventTable;
    this.on = function(type, cb){
        if(!(type in eventTable)){
            eventTable[type] = [];
        }
        eventTable[type].push(cb);
        return {
            remove:function(){
                let l = eventTable[type];
                l.splice(l.indexOf(cb),1);//garbage collection
                if(l.length === 0){
                    delete eventTable[type];
                    return true;//all listeners removed
                }else{
                    return false;
                }
            }
        }
    };
    this.emit = function(type){
        const elist = eventTable[type] || [];
        console.log(type,elist);
        for(let i = 0; i < elist.length; i++){
            elist[i].apply(this,[...arguments].slice(1));
        }
    };
};


//async utility
let LoadWaiter = function(){
    let queue = [];
    let waiting = true;
    this.ready = function(){
        return new Promise((res,rej)=>{
            if(waiting){
                queue.push(res);
            }else{
                res();
            }
        });
    };
    this.pause = function(){
        waiting = true;
    };
    this.resolve = function(){
        waiting = false;
        queue.map(cb=>cb());//resolve all
        queue = [];
    };
};

let Pause = function(t){
    return new Promise((res,rej)=>{
        setTimeout(res,t);
    });
};

let IDSPACE = function(){
    let id = 0;
    this.new = function(){
        return (id++)+"";
    }
};





let Watcher = function(elem){
    console.log("watching: ",elem);
    let ID = new IDSPACE();
    let bus = new Events();
    let shadowBus = new Events();//for self check funcs
    let selfCheckFuncs = {};
    this.on = function(type,cb){
        if(typeof type === "function"){
            if(!("__id" in type)){
                let id = ID.new();
                selfCheckFuncs[id] = type;
                type._id = id;
            }
            let id = type._id;
            let remover = shadowBus.on(id,cb);
            return {
                remove:function(){
                    if(remover.remove()){//all listeners removed
                        delete selfCheckFuncs[id];
                        delete type._id;
                    }
                }
            };
        }else{
            return bus.on(type,cb);
        }
    };
    
    let metadata = {
        "innerText":""
    };
    
    let functable = {
        "innerText":function(){
            let content = metadata["innerText"];
            console.log(content,elem.innerText);
            if(content !== elem.innerText){
                console.log("different!!!");
                metadata["innerText"] = elem.innerText;
                bus.emit("innerText",content);
            }
        }
    };
    
    setInterval(()=>{
        for(let type in bus.eventTable){
            if(type in functable){
                functable[type]();
            }else{
                console.log("warning: regisered event type not present");
            }
        }
        for(id in selfCheckFuncs){
            if(selfCheckFuncs[id](elem)){
                shadowBus.emit(id);
            }
        }
    },100);//every 100ms
};


let SyncedInterval = function(t){
    let cbs = [];
    this.set = function(cb){
        cbs.push(cb);
        return {
            cancel:function(){
                cbs.splice(cbs.indexOf(cb),1);
            }
        };
    };
    let stop = false;
    let main = function(){
        cbs.map(cb=>cb());
        if(!stop)setTimeout(main,t);
    };
    this.stop = function(){
        stop = true;
    };
    this.start = function(){
        if(stop){
            stop = false;
            main();
        }else{
            console.log("the timeout loop has already been started");
        }
    };
};

//test change 1