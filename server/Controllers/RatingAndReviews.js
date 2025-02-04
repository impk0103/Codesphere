const RatingAndReview = require("../Models/RatingAndReview");
const Course = require("../Models/Course");
const { default: mongoose } = require("mongoose");


exports.createRating = async(req,res)=>{
    try{
        const userId= req.user.id;
        const {courseId, rating ,review}= req.body;

       
        const isEnrolled= await Course.findOne({_id:courseId,
                                                    studentsEnrolled: {$elemMatch: {$eq:userId}}
                                                        });
        
        if(!isEnrolled)
        {
            return res.status(404).json({
                success:false,
                message:"You are not allowed to review this course, get enrolled first."
            })
        }    

        const alreadyReviewed = await RatingAndReview.findOne({ user:userId,
                                                                course:courseId });
        (alreadyReviewed);
        if(alreadyReviewed){
            return res.status(404).json({
                success:false,
                message:"Already reviewed the course"
            })
        }

        const ratingAndReview = await RatingAndReview.create({
            rating,
            review,
            user:userId,
            course:courseId,
        })

        const updatedCourseDetail = await Course.findByIdAndUpdate({_id:courseId},
            {
                $push:{
                    ratingAndReviews:ratingAndReview._id
                }
            },
            {new:true},
        )
      
        return res.status(200).json({
            success:true,
            message:"Rating and Review created Successfully"
        })


    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}


exports.getAverageRating= async(req,res)=>{
    try{
        const courseId= req.body.courseId;

        const result = await RatingAndReview.aggregate([
            {
                $match:{
                    course: mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group:{
                    _id:null,
                    averageRating:{$avg: "$rating" }
                }
            }
        ]);


        if(result.length>0){
            return res.status(200).json({
                success:true,
                averageRating:result[0].averageRating
            })
        }

        return res.status(200).json({
            success:true,
            message:"Average rating is 0 , no rating given till now",
            averageRating:0
        })

        
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

exports.getAllRating = async(req,res)=>{
    try{
           const allReviews = await RatingAndReview.find({})
                                        .sort({rating:"desc"})
                                        .populate({
                                             path:"user",
                                             select:"firstName lastName email image"
                                        })
                                        .populate({
                                            path:"course",
                                            select:"courseName"
                                        })
                                        .exec();

        return res.status(200).json({
            success:true,
            message:"All reviews fetched successfully",
            data:allReviews
        })
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}