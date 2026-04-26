let express=require('express');
let router=express.Router();


let{auth}=require('../Middlewares/auth')
let {createComplaint,getAllComplaint,getComplaintById,editComplaint,deleteComplaint,changeStatus}=require('../controllers/Complaint')

router.post('/',auth,createComplaint);
router.get('/',auth,getAllComplaint);//  restrictTo('admin') 
router.get('/:id',auth,getComplaintById);
router.patch('/:id',auth,editComplaint);
router.delete('/:id',auth,deleteComplaint); 

router.patch('/:id/status',auth,changeStatus);//  restrictTo('admin') 

module.exports=router;