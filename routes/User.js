let express =require('express');
let router=express.Router();

//
let {deleteUserById,editUserById,getUserById,getAllUsers,login,signUP,updatePassword,forgetPassword,verifyResetCode,resetPassword}=require('../Controller/User')
let {auth}=require('../Middlewares/auth');


router.post('/',signUP);
router.post('/login',login);

router.post('/forgetPassword',forgetPassword);
router.post('/verifyResetCode', verifyResetCode);
router.put('/resetPassword', resetPassword);

router.patch('/updatePassword',auth,updatePassword);

// restrictTo('admin') 
router.get('/',auth,getAllUsers);

router.get('/:id',auth,getUserById);

router.patch('/:id',auth,editUserById); 

//  restrictTo('admin') 
router.delete("/:id",auth,deleteUserById) 


module.exports=router;