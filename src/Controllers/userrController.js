import sequelize from "../Models/index.js";
import initModels from "../Models/init-models.js";
import { Sequelize } from "sequelize";
import bcrypt from "bcrypt";
import { taoToken } from "../Config/jwtConfig.js";

const Op = Sequelize.Op;

const model = initModels(sequelize);

//đăng ký tài khoản
const signUp = async (req, res) => {
  try {
    const { email, mat_khau, ho_ten, tuoi } = req.body;

    let checkEmail = await model.nguoi_dung.findAll({
      where: {
        email,
      },
    });

    if (checkEmail.length > 0) {
      return res.status(409).send("The email is already registered");
    }

    let newData = {
      email,
      mat_khau: bcrypt.hashSync(mat_khau, 10),
      ho_ten,
      tuoi,
    };

    await model.nguoi_dung.create(newData);
    return res.status(201).send("Registration is successful");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

//đăng nhập tài khoản
const signIn = async (req, res) => {
  try {
    const { email, mat_khau } = req.body;

    let checkEmail = await model.nguoi_dung.findOne({
      where: {
        email,
      },
    });

    if (checkEmail) {
      let checkPassWord = bcrypt.compareSync(mat_khau, checkEmail.mat_khau);
      if (checkPassWord == true) {
        let token = taoToken(checkEmail);
        res.status(200).send({
          checkEmail,
          token,
        });
      } else {
        res.status(400).send("Password is incorrect");
      }
    } else {
      res.status(400).send("Email is incorrect");
    }
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
    console.log(err);
  }
};

//lấy thông tin user

const getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await model.nguoi_dung.findOne({
      where: {
        nguoi_dung_id: userId,
      },
    });

    if (user) {
      return res.status(200).send(user);
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
//lấy danh sách hình ảnh đã save theo user

const getSavedImagesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const savedImages = await model.luu_anh.findAll({
      where: {
        nguoi_dung_id: userId,
      },
    });

    if (savedImages.length > 0) {
      const imageIds = savedImages.map((savedImage) => savedImage.hinh_id);
      console.log(imageIds);

      const images = await model.hinh_anh.findAll({
        where: {
          hinh_id: imageIds,
        },
      });

      res.status(200).json(images);
    } else {
      res.status(404).json({ message: "No saved images found for this user" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

//lấy danh sách đã tạo theo userid
const getCreatedImagesbyUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const createdImages = await model.hinh_anh.findAll({
      where: {
        nguoi_dung_id: userId,
      },
    });

    if (createdImages && createdImages.length > 0) {
      res.status(200).json(createdImages);
    } else {
      res
        .status(404)
        .json({ message: "No created images found for this user" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

//cập nhật thông tin người dùng

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, mat_khau, ho_ten, tuoi } = req.body;

    let checkEmail = await model.nguoi_dung.findAll({
      where: {
        email,
        nguoi_dung_id: {
          [Op.ne]: userId,
        },
      },
    });

    if (checkEmail.length > 0) {
      return res.status(400).send("Email is already registered for another user");
    }

    await model.nguoi_dung.update(
      {
        ho_ten,
        email,
        mat_khau: bcrypt.hashSync(mat_khau, 10),
        tuoi,
      },
      {
        where: { nguoi_dung_id: userId },
      }
    );

    return res.status(200).send("Your profile is updated!");
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  getUserDetail,
  getSavedImagesByUserId,
  getCreatedImagesbyUserId,
  signUp,
  signIn,
  updateUser,
};
