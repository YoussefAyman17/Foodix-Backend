const mongoose =require('mongoose');
const Meal = require('../models/mealModel');
const reviewSchema = new mongoose.Schema({
comment:{
    type:String,
    required:[true,'Comment can not be empty!']
},
rating: {
  type: Number,
  required: [true, 'Rating is required'],
  min: [1, 'Rating must be at least 1'],
  max: [5, 'Rating cannot be more than 5']
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
},{ timestamps: true },)


reviewSchema.index({ meal: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/,function(){
    this.populate({
        path:'user',
        select:'userName profilePic'
    })
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
reviewSchema.pre(/^findOneAnd/, async function() {
this.r = await this.model.findOne(this.getQuery());
});

reviewSchema.post(/^findOneAnd/, async function() {
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.meal);
  }
});

const Review = mongoose.model('Review',reviewSchema)
module.exports =Review;