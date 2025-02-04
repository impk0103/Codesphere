const Category = require('../Models/Category');

exports.createCategory= async (req,res)=>{
    try{
        const {name, description}=req.body;
      
        if(!name || !description){
            return res.status(400).json({
                success:false,
                message:'All fields are required',
            })
        }

        const categoryDetails = await Category.create({
            name:name,
            description:description
        })  

      
        return res.status(200).json({
            success:true,
            message:"Category Created successfully" 
        })

    }catch(error){
        return res.status(500).json({
            success:false, 
            message:error.message,
        })
    }
}


exports.showAllcategory = async(req,res)=>{
    try{
        const allCategory = await Category.find({}, {name:true, description:true});
        res.status(200).json({
            success:true,
            message:"All categories returned successfully",
            data:allCategory
        })
    }catch(error){
         return res.status(500).json({
            success:false,
            message:error.message,
         })
    }
}

exports.categoryPageDetails = async (req, res) => {
    try {
      const { categoryId } = req.body
      
      const selectedCategory = await Category.findById(categoryId)
        .populate({
          path: "course",
          match: { status: "Published" },
          populate: "ratingAndReviews",
        })
        .exec()
  
     
      if (!selectedCategory) {
       
        return res
          .status(404)
          .json({ success: false, message: "Category not found" })
      }
      // Handle the case when there are no courses
      if (selectedCategory.course.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No courses found for the selected category.",
        })
      }






  
      // Get categories except the selected one
      const categoriesExceptSelected = await Category.find({
        _id: { $ne: categoryId },
      });

     

      


    // Pick a random category from the remaining ones
    const randomCategoryIndex = Math.floor(Math.random() * categoriesExceptSelected.length);
    const randomCategoryId = categoriesExceptSelected[randomCategoryIndex]._id;

    // Retrieve and populate the courses of the random category
    const differentCategory = await Category.findOne({ _id: randomCategoryId })
      .populate({
        path: "course",
        match: { status: "Published" },
      })
      .exec();

    






      // Get top-selling courses across all categories
      const allCategories = await Category.find()
        .populate({
          path: "course",
          match: { status: "Published" },
          populate: {
            path: "instructor",
        },
        })
        .exec()

      const allCourses = allCategories.flatMap((category) => category.course)
      const mostSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)
   
     
     
     
     
     
     
       res.status(200).json({
        success: true,
        data: {
          selectedCategory,
          differentCategory,
          mostSellingCourses,
        },
      })
    } catch (error) {
      console.log("Error", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }
