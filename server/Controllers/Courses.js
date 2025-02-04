const Course = require("../Models/Course")
const Category = require("../Models/Category")
const Section = require("../Models/Section")
const SubSection = require("../Models/SubSection")
const User = require('../Models/User');
const {uploadImgToCloudinary} = require('../Utils/imageUploader');
const CourseProgress = require("../Models/CourseProgress")
const { convertSecondsToDuration } = require("../Utils/secToDuration")


exports.createCourse =async(req,res)=>{
    try{
  
         let {courseName , courseDescription, whatYouWillLearn, price, category, tags ,status ,instructions}= req.body;
         const userId= req.user.id;
         const thumbnail=req.files.thumbnailImage;



         
         if(!courseName || !courseDescription || !whatYouWillLearn || !price || !category ||  !tags || !thumbnail || !instructions){
            return res.status(200).json({
                success:false,
                message:"All fields are mandatory"
            }) 
         }

         if(!status || status === undefined) 
        {
			status = "Draft";
		}

         const instructorDetails =await User.findById(userId);
        
         if(! instructorDetails){
            return res.status(400).json({
                success:false,
                message:"Instructor Details not found",
            })
         }

         const  categoryDetails =await Category.findById(category);
         if(!categoryDetails){
            return res.status(400).json({
                success:false,
                message:"Category Details not found",
            })
         }
 
         const thumbnailImage = await uploadImgToCloudinary(thumbnail,process.env.FOLDER_NAME)
        

         const newCourse =await Course.create(
            {
                courseName,
                courseDescription,
                instructor:instructorDetails._id,
                whatYouWillLearn: whatYouWillLearn,
                price,
                category:categoryDetails._id,
                tags,
                thumbnail:thumbnailImage.secure_url,
                instructions,
                status
            }
         )

         await User.findByIdAndUpdate({_id:instructorDetails._id},
            {
                $push:{
                    courses:newCourse._id,
                }
            },
            {new:true},
         );

         await Category.findByIdAndUpdate({_id:categoryDetails._id},
            {
                $push:{
                    course:newCourse._id,
                }
            },
            {new:true},
         );
         return res.status(200).json({
            success:true,
            message:"course created successfully",
            data:newCourse,
        })

    }catch(error){
        console.log(error)
        return res.status(400).json({
            success:false,
            message:"Error occured during course creation",
            error:error.message
        })

        
    }
}

exports.showAllCourses = async(req,res)=>{
    try{
        const allCourse = await Course.find({}, {courseName:true, price:true, thumbnail:true, instructor:true, ratingAndReviews:true, tags:true, studentsEnrolled:true}).populate("instructor").exec();
        res.status(200).json({
            success:true,
            message:"All course returned successfully",
            data:allCourse
        })
    }catch(error){
         console.log(error); 
         return res.status(500).json({
            success:false,
            message:'Cannot fetch course data',
         })
    }
} 

exports.editCourse = async (req, res) => {
    try {
      const { courseId } = req.body
      const updates = req.body
      const course = await Course.findById(courseId)
  
      if (!course) {
        return res.status(404).json({ error: "Course not found" })
      }
  
      // If Thumbnail Image is found, update it
      if (req.files) {
       
        const thumbnail = req.files.thumbnailImage
        const thumbnailImage = await uploadImageToCloudinary(
          thumbnail,
          process.env.FOLDER_NAME
        )
        course.thumbnail = thumbnailImage.secure_url
      }
  
      // Update only the fields that are present in the request body
      for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
          if (key === "tag" || key === "instructions") {
            course[key] = JSON.parse(updates[key])
          } else {
            course[key] = updates[key]
          }
        }
      }
  
      await course.save()
  
      const updatedCourse = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }

exports.getCourseDetail = async(req,res)=>{
    try{
        const {courseId}= req.body;

        const courseDetails = await Course.findById(courseId)
            .populate({
                path: "instructor",
                populate:{
                    path:"additionalDetails"
                }
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate:{
                    path:"subSection"
                }
            }).exec();

           if(!courseDetails){
               return res.status(400).json({
                success:false,
                message:   `Could not find course with courseId ${courseId}`
               })
           }
         
           return res.status(200).json({
            success:true,
            message:`Course Details Fetched Successfully`,
            data:courseDetails,
           })
        

    }catch(error){
        console.log(error);
        return res.status(500).json({
          success:false,
          error:error.message,
          message:"Unable to fetch complete course Detail"
        })
    }
}

exports.getFullCourseDetails = async (req, res) => {
    try {
      const { courseId } = req.body
      const userId = req.user.id
      const courseDetails = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      let courseProgressCount = await CourseProgress.findOne({
        courseID: courseId,
        userId: userId,
      })
  
      
  
      if (!courseDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find course with id: ${courseId}`,
        })
      }
  
      // if (courseDetails.status === "Draft") {
      //   return res.status(403).json({
      //     success: false,
      //     message: `Accessing a draft course is forbidden`,
      //   });
      // }
  
      let totalDurationInSeconds = 0
      courseDetails.courseContent.forEach((content) => {
        content.subSection.forEach((subSection) => {
          const timeDurationInSeconds = parseInt(subSection.timeDuration)
          totalDurationInSeconds += timeDurationInSeconds
        })
      })
  
      const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
  
      return res.status(200).json({
        success: true,
        data: {
          courseDetails,
          totalDuration,
          completedVideos: courseProgressCount?.completedVideos
            ? courseProgressCount?.completedVideos
            : [],
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
}
  
exports.getInstructorCourses = async (req, res) => {
    try {
      // Get the instructor ID from the authenticated user or request body
      const instructorId = req.user.id
  
      // Find all courses belonging to the instructor
      const instructorCourses = await Course.find({
        instructor: instructorId,
      }).sort({ createdAt: -1 }).populate({
        path: 'courseContent',
        populate: {
          path: 'subSection',
        },
      })
      .exec()
  
      // Return the instructor's courses
      res.status(200).json({
        success: true,
        data: instructorCourses,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Failed to retrieve instructor courses",
        error: error.message,
      })
    }
}

exports.deleteCourse = async (req, res) => {
    try {
      const { courseId } = req.body
  
      // Find the course
      const course = await Course.findById(courseId)
      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }
  
      // Unenroll students from the course
      const studentsEnrolled = course.studentsEnrolled
      for (const studentId of studentsEnrolled) {
        await User.findByIdAndUpdate(studentId, {
          $pull: { courses: courseId },
        })
      }
  
      // Delete sections and sub-sections
      const courseSections = course.courseContent
      for (const sectionId of courseSections) {
        // Delete sub-sections of the section
        const section = await Section.findById(sectionId)
        if (section) {
          const subSections = section.subSection
          for (const subSectionId of subSections) {
            await SubSection.findByIdAndDelete(subSectionId)
          }
        }
  
        // Delete the section
        await Section.findByIdAndDelete(sectionId)
      }
  
      // Delete the course
      await Course.findByIdAndDelete(courseId)
  
      return res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      })
    }
}

