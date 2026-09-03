const mongoose=require("mongoose");
const initData=require("./data.js");
const Listing=require("../models/listing.js");


main().then(()=>{
    console.log("mongodb is connected !")
}).catch(err=>{
    console.log(err)
});

async function main(){
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderLust')
};

const initdb=async ()=>{
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj)=>({
        ...obj,
        owner:'6a97fc732307b46fe653220a'}))
    await Listing.insertMany(initData.data);
    // initial data inserted
}

initdb();