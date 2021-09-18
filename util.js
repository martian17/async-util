//util functions
const Events = function(){
    const eventTable = {};
    this.table = eventTable;
    this.on = function(type, cb){
        let resResult = onRegister(type, cb);
        if(resResult)return resResult;
        
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
                }
            }
        }
    };
    this.emit = function(type){
        const elist = eventTable[type] || [];
        for(let i = 0; i < elist.length; i++){
            elist[i].apply(this,[...arguments].slice(1));
        }
    };
    this.onRegister = (type,cb)=>{return false};
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
let ID = new IDSPACE();


let Watcher = function(elem){
    let bus = new Events();
    let selfCheckFuncs = {};
    bus.resResult = function(type,cb){
        if(typeof type === "function"){
            if(!("__id" in type)){
                let id = ID.new();
                selfCheckFuncs[id] = [type,[]];
                type._id = id;
            }
            let section = selfCheckFuncs[type._id];
            section[1].push(cb);
            return {
                remove:function(){
                    section[1].splice(section[1].indexOf(cb),1);//garbage collection
                    if(section[1].length === 0){
                        //delete the type as well
                        delete selfCheckFuncs[type._id];
                        delete type._id;
                    }
                }
            }
        }else{
            return false;
        }
    };
    this.on = bus.on.bind(bus);
    
    let metadata = {
        "innerText":""
    };
    
    let functable = {
        "innerText":function(){
            let conent = metadata["innerText"];
            if(content !== elem.innerText){
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
            let section = selfCheckFuncs[id];
            if(section[0](elem)){
                section[1].map(cb=>cb(elem));
            }
        }
    },100);//every 100ms
    this.on = bus.on.bind(bus);
};