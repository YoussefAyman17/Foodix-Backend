const jwt=require('jsonwebtoken');
const util=require('util');

const asyncHandler =require('../Utils/asyncErrorHandler')
const customError=require('../Utils/customError');

const auth =asyncHandler(async(req,res,next)=>{
    let {authorization}=req.headers;

    if(!authorization){
     return next(new customError("You Must Login First",401));
    }
    let decoded =await util.promisify(jwt.verify)(authorization,process.env.SECRET)
    req.id=decoded.id;
    next();
});

// const restrictTo=(...roles)=>{};

module.exports={auth};