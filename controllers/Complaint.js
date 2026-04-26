const complaintModel=require('../Models/Complaint')
const asyncHandler =require('../Utils/asyncErrorHandler')
const customError=require('../Utils/customError');


 let createComplaint = asyncHandler(async(req,res,next)=>{
    let newComplaint =req.body;
    newComplaint.userId=req.id;
    let complaint =await complaintModel.create(newComplaint);
    res.status(200).json({message:"Complaint Created",Data:complaint});
 });


 let getAllComplaint = asyncHandler(async(req,res,next)=>{
    let complaints=await complaintModel.find().populate('userId', 'userName email');
    res.status(200).json({complaints});
 });


 let getComplaintById = asyncHandler(async(req,res,next)=>{
    let {id}=req.params;
    let Complaint = await complaintModel.findById(id).populate('userId', 'userName email');

    if(Complaint){
        res.status(200).json({Data:Complaint});
    }else{
       next(new customError("Complaint Not Found", 404));
    }
 });


let editComplaint = asyncHandler(async (req, res, next) => {
    let { id } = req.params;

    let complaint = await complaintModel.findByIdAndUpdate(
        id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    if (complaint) {
        res.status(200).json({
            message: "Complaint Updated Successfully",
            Data: complaint
        });
    } else {
        next(new customError("Complaint Not Found", 404));
    }
});


 let deleteComplaint = asyncHandler(async(req,res,next)=>{
    let {id} =req.params;
    let Complaint =await complaintModel.findByIdAndDelete(id);
      if(Complaint){
        res.status(200).json({message:"Complaint deleted Succesfully",DeletedId:id});
    }else{
        next(new customError("Complaint Not Found",404))
    }
 });

let changeStatus = asyncHandler(async (req, res, next) => {
    let { id } = req.params;
    let { status } = req.body;

    let complaint = await complaintModel.findByIdAndUpdate(
        id,
        { status },
        {
            new: true,
            runValidators: true
        }
    );

    if (complaint) {
        res.status(200).json({
            message: "Status Complaint Updated Successfully",
            Data: complaint
        });
    } else {
        next(new customError("Complaint Not Found", 404));
    }
});



 module.exports={createComplaint,getAllComplaint,getComplaintById,editComplaint,deleteComplaint,changeStatus};