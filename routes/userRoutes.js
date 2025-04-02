const express = require("express");
const UserController = require("./../controllers/userController");
const ac = require("./../controllers/authController");
const uc = new UserController();

const router = express.Router();

// have to maintain binding in functions
const requireId = uc.requireId.bind(uc);
const getItems = uc.getItems.bind(uc);
const createItem = uc.createItem.bind(uc);
const updateItem = uc.updateItem.bind(uc);
const deleteItem = uc.deleteItem.bind(uc);

router.route("/").get(ac.authorizeUser, getItems);
router.route("/:id").get(ac.authorizeUser, getItems);
// POST, PUT or PATCH? (PUT means complete overwrite, requiring all fields)
router.route("/").post(ac.authorizeAdmin, createItem);
router.route("/:id").post(ac.authorizeAdmin, requireId, updateItem);
router.route("/:id").delete(ac.authorizeAdmin, requireId, deleteItem);

module.exports = router;
