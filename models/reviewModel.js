const mongoose =require('mongoose');
const Meal = require('../models/mealModel');
const reviewSchema = new mongoose.Schema({
comment:{
    type:String,
    required:['true','Review can not be empty!']
},
rating:{
    type:Number,
    min:1,
    max:5
},
createdAt:{
    type:Date,
    default:Date.now
},
user:{
    type:mongoose.Schema.ObjectId,
    ref:'User',
    required: [true, 'Review must belong to a user']
},
meal:{
    type:mongoose.Schema.ObjectId,
    ref:'Meal',
    required: [true, 'Review must belong to a meal.']
}
})


reviewSchema.index({ meal: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/,function(next){
    this.populate({
        path:'user',
        select:'userName profilePic'
    })
    next();
})


reviewSchema.statics.calcAverageRatings = async function(mealId) {
  const stats = await this.aggregate([
    {
      $match: { meal: mealId }
    },
    {
      $group: {
        _id: '$meal',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Meal.findByIdAndUpdate(mealId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Meal.findByIdAndUpdate(mealId, {
      ratingsQuantity: 0,
      ratingsAverage: 0
    });
  }
};

// create
reviewSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.meal);
});

// delete and update 
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.meal);
  }
});

const Review = mongoose.model('Review',reviewSchema)
module.exports =Review;