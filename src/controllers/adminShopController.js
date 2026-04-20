import bcrypt from "bcryptjs";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Session from "../models/Session.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

export const createShop = asyncHandler(async (req, res) => {
  const {
    shop_name,
    shop_phone,
    shop_address,
    user_name,
    username,
    password,
    shop_type,
    main_username,
  } = req.body;

  const existingUser = await User.findOne({ where: { username } });
  if (existingUser) throw new AppError("Username already exists", 400);

  let parent_shop_id = null;
  if (shop_type === "branch") {
    if (!main_username)
      throw new AppError("Main shop username is required for branch", 400);

    const mainUser = await User.findOne({ where: { username: main_username } });
    if (!mainUser) throw new AppError("Main shop user not found", 404);

    const mainShop = await Shop.findOne({
      where: { id: mainUser.shop_id, shop_type: "main" },
    });
    if (!mainShop) throw new AppError("Main shop not found", 404);

    parent_shop_id = mainShop.id;
  }

  const trial_start = new Date();
  const trial_end = new Date();
  trial_end.setDate(trial_end.getDate() + 14);

  const shop = await Shop.create({
    name: shop_name,
    phone: shop_phone,
    address: shop_address,
    shop_type: shop_type || "individual",
    parent_shop_id,
    trial_start,
    trial_end,
    is_trial: true,
  });

  const hashed = await bcrypt.hash(password, 12);
  await User.create({
    shop_id: shop.id,
    name: user_name,
    username,
    password: hashed,
  });

  res.status(201).json({ message: "Shop created successfully" });
});

export const updateShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findByPk(req.params.id);
  if (!shop) throw new AppError("Shop not found", 404);

  const { shop_name, shop_phone, shop_address, username, password } = req.body;

  await shop.update({
    ...(shop_name && { name: shop_name }),
    ...(shop_phone && { phone: shop_phone }),
    ...(shop_address && { address: shop_address }),
  });

  if (username || password) {
    const user = await User.findOne({ where: { shop_id: shop.id } });
    if (!user) throw new AppError("User not found", 404);

    if (username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser && existingUser.id !== user.id)
        throw new AppError("Username already exists", 400);
    }

    await user.update({
      ...(username && { username }),
      ...(password && { password: await bcrypt.hash(password, 12) }),
    });
  }

  res.json({ message: "Shop updated successfully" });
});

export const getShops = asyncHandler(async (req, res) => {
  const shops = await Shop.findAll({
    where: { shop_type: ["individual", "main"] },
    include: [
      { model: User, attributes: ["name", "username"] },
      {
        model: Shop,
        as: "branches",
        attributes: [
          "id",
          "name",
          "phone",
          "is_active",
          "subscription_status",
          "subscription_end",
          "trial_end",
          "is_trial",
        ],
      },
    ],
  });
  res.json(shops);
});

export const toggleShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findByPk(req.params.id);
  if (!shop) throw new AppError("Shop not found", 404);

  const newStatus = !shop.is_active;
  await shop.update({ is_active: newStatus });

  if (!newStatus) {
    const users = await User.findAll({ where: { shop_id: shop.id } });
    for (const user of users) {
      await Session.destroy({ where: { user_id: user.id } });
    }
  }

  res.json({ message: `Shop ${newStatus ? "activated" : "deactivated"}` });
});

export const deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findByPk(req.params.id);
  if (!shop) throw new AppError("Shop not found", 404);

  const admin = await Admin.findByPk(req.admin.id);
  const valid = await bcrypt.compare(req.body.password, admin.password);
  if (!valid) throw new AppError("Invalid password", 401);
  const users = await User.findAll({ where: { shop_id: shop.id } });
  for (const user of users) {
    await Session.destroy({ where: { user_id: user.id } });
  }
  await User.destroy({ where: { shop_id: shop.id } });
  const branches = await Shop.findAll({ where: { parent_shop_id: shop.id } });
  for (const branch of branches) {
    const branchUsers = await User.findAll({ where: { shop_id: branch.id } });
    for (const u of branchUsers) {
      await Session.destroy({ where: { user_id: u.id } });
    }
    await User.destroy({ where: { shop_id: branch.id } });
    await branch.destroy();
  }

  await shop.destroy();
  res.json({ message: "Shop deleted successfully" });
});
