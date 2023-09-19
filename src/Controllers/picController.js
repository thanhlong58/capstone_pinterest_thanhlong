import sequelize from "../Models/index.js";
import initModels from "../Models/init-models.js";
import { Sequelize } from "sequelize";

const Op = Sequelize.Op;

const model = initModels(sequelize);

//lấy danh sách hình ảnh
const getPic = async (req, res) => {
  try {
    const data = await model.hinh_anh.findAll();
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//tìm kiếm danh sách hình ảnh theo tên

const getPicbyName = async (req, res) => {
  try {
    const { picName } = req.params;

    const data = await model.hinh_anh.findAll({
      where: {
        ten_hinh: {
          [Op.like]: `%${picName}%`,
        },
      },
    });

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//TRANG CHI TIẾT
//lấy thông tin ảnh và người tạo dựa vào id ảnh
const getPictureDetail = async (req, res) => {
  try {
    const { picId } = req.params;

    const picture = await model.hinh_anh.findOne({
      where: { hinh_id: picId },
      include: [{ model: model.nguoi_dung, as: "nguoi_dung" }],
    });

    if (!picture) {
      return res.status(404).json({ message: "Picture not found" });
    }

    return res.json({ picture });
  } catch (error) {
    console.error("Error retrieving picture detail:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//lấy thông tin bình luận theo ảnh

const getCommentsByPictureId = async (req, res) => {
  try {
    const { picId } = req.params;

    const comments = await model.binh_luan.findAll({
      where: { hinh_id: picId },
    });

    return res.json({ comments });
  } catch (error) {
    console.error("Error retrieving comments by picture ID:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//lấy thông tin đã lưu hình này chưa theo id ảnh

const savePic = async (req, res) => {
  try {
    const { picId, userId } = req.params;
    const currentDate = new Date();

    const existingRow = await model.luu_anh.findOne({
      where: {
        nguoi_dung_id: userId,
        hinh_id: picId,
      },
    });

    if (existingRow) {
      return res.status(400).json({ message: "Picture is already saved" });
    } else {
     
      await model.luu_anh.create({
        nguoi_dung_id: userId,
        hinh_id: picId,
        ngay_luu: currentDate,
      });

      
      const savedPic = await model.hinh_anh.findOne({
        where: {
          hinh_id: picId,
        },
      });

      return res.status(200).send(savedPic);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//post comment

const postComment = async (req, res) => {
  try {
    const currentDate = new Date();

    const { noi_dung, nguoi_dung_id } = req.body;
    const { picId } = req.params;

    const picture = await model.hinh_anh.findOne({
      where: { hinh_id: picId },
    });

    if (!picture) {
      return res.status(404).json({ error: "Picture not found" });
    }

    const newComment = await model.binh_luan.create({
      hinh_id: picId,
      noi_dung,
      nguoi_dung_id,
      ngay_binh_luan: currentDate,
    });

    res.status(201).json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error posting comment" });
  }
};

//lấy hình đã lưu theo trang chi tiết
const getPicSavedDetailPage = async (req, res) => {
  try {
    const { picId, userId } = req.params;

    const savedPic = await model.luu_anh.findOne({
      where: {
        hinh_id: picId,
        nguoi_dung_id: userId,
      },
    });

    res.send(savedPic);
  } catch (err) {
    console.log(err);
  }
};

//thêm ảnh lên server

const postPic = async (req, res) => {
  try {
    const file = req.file;
    const { nguoi_dung_id, mo_ta, ten_hinh } = req.body;

    const duong_dan = `http://localhost:8080/public/img/${file.filename}`;

    const data = await model.hinh_anh.create({
      nguoi_dung_id,
      duong_dan,
      mo_ta,
      ten_hinh,
    });
    res.status(200).send(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// lấy danh sách ảnh liên quan theo hình id
const getPicsRelated = async (req, res) => {
  try {
    const { picId } = req.params;

    const pic = await model.hinh_anh.findOne({
      where: {
        hinh_id: picId,
      },
    });

    if (!pic) {
      return res.status(404).json({ error: "Picture not found" });
    }

    const picFirstTwoChars = pic.ten_hinh.substring(0, 2);

    const picsRelated = await model.hinh_anh.findAll({
      where: {
        ten_hinh: {
          [Op.like]: `${picFirstTwoChars}%`,
        },
        hinh_id: {
          [Op.not]: picId,
        },
      },
    });

    res.json(picsRelated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

//kiểm tra ảnh đã lưu chưa theo id ảnh
const checkIsSaved = async (req, res) => {
  try {
    const { picId, userId } = req.params;

    const picSaved = await model.luu_anh.findOne({
      where: {
        hinh_id: picId,
        nguoi_dung_id: userId,
      },
    });

    if (picSaved) {
      res.status(200).json({ isSaved: true });
    } else {
      res.status(200).json({ isSaved: false });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

//xóa ảnh đã tạo
const deleteImage = async (req, res) => {
  try {
    const { picId, userId } = req.params;

   
    const picToDelete = await model.hinh_anh.findOne({
      where: {
        hinh_id: picId,
      },
    });

    if (!picToDelete) {
      return res.status(404).json({ message: "Image does not exist" });
    }

    if (picToDelete.nguoi_dung_id == userId) {
      picToDelete.destroy();

      return res.status(200).json({ message: "Delete successful" });
    } else {
      return res
        .status(403)
        .json({ message: "Cannot delete another user's image" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export {
  getPic,
  getPicbyName,
  getPictureDetail,
  getCommentsByPictureId,
  savePic,
  postComment,
  getPicSavedDetailPage,
  postPic,
  getPicsRelated,
  checkIsSaved,
  deleteImage,
};
