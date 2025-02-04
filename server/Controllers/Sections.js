const Course = require('../Models/Course');
const Section =require('../Models/Section');
const mongoose = require('mongoose');
const SubSection = require('../Models/SubSection');
exports.createSection= async (req,res)=>{
    try{
        const {sectionName,courseId}=req.body;
          
        if(!sectionName || !courseId){
            return res.status(400).json({
                success:false,
                message:'Missing Properties',
            })
        }

        const sectionDetails = await Section.create({
            sectionName,
        })  

         

        const updatedCourseDetails = await Course.findByIdAndUpdate({_id:courseId},
            {
                $push:{
                    courseContent:sectionDetails._id,
                }
            },
            {new:true},
         ).populate({
            path: "courseContent",
            populate: {
                path: "subSection",
            },
        })
        .exec();

        
        


        return res.status(200).json({
            success:true,
            message:"Section Created successfully" ,
            data:updatedCourseDetails
        })

    }catch(error){
        return res.status(500).json({
            success:false, 
            message:"Unable to create section",
            error:error.message
        })
    }
}

exports.updateSection= async(req,res)=>{
    try{
       const {newSectionName,sectionId,courseId}= req.body;
       if(!newSectionName || !sectionId || !courseId){
        return res.status(400).json({
            success:false,
            message:'Missing Properties',
        })
       }
    
       const updatedSection = await Section.findByIdAndUpdate(sectionId,{sectionName:newSectionName},{new:true});
       const course = await Course.findById(courseId).populate({
        path:"courseContent",
        populate:{
            path:"subSection",
        }
       }).exec();
       return res.status(200).json({
        success:true,
        message:"Section Updated successfully" ,
        data:course  
    })
    }catch(error){
        return res.status(500).json({
            success:false, 
            message:"Unable to update section",
            error:error.message
        })
    }
}


exports.deleteSection= async(req,res)=>{
    try{
       const {sectionId,courseId}= req.body;
       await Course.findByIdAndUpdate(
        { _id: courseId },
        {
          $pull: {
            courseContent: sectionId,
          },
        }
      )
      const section = await Section.findById({ _id: sectionId })
      if (!section) {
        return res
          .status(404)
          .json({ success: false, message: "Section not found" })
      }

      //delete sub section
		await SubSection.deleteMany({_id: {$in: section.subSection}});

		await Section.findByIdAndDelete(sectionId);
        const course = await Course.findById(courseId).populate({
			path:"courseContent",
			populate: {
				path: "subSection"
			}
		})
		.exec();
  
       return res.status(200).json({
        success:true,
        message:"Section Deleted successfully" ,
        data:course
    })
    }catch(error){
        return res.status(500).json({
            success:false, 
            message:"Unable to delete section",
            error:error.message
        })
    }
}


