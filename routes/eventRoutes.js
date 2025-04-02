const express = require("express");
const EventController = require("./../controllers/eventController");
const ac = require("./../controllers/authController");
const ec = new EventController();

const router = express.Router();

// have to maintain binding in functions
const requireId = ec.requireId.bind(ec);
const getItems = ec.getItems.bind(ec);
const createItem = ec.createItem.bind(ec);
const updateItem = ec.updateItem.bind(ec);
const deleteItem = ec.deleteItem.bind(ec);

router.route("/").get(ac.authorizeUser, getItems);

router.route("/:id").get(ac.authorizeUser, getItems);

router.route("/").post(ac.authorizeAdmin, createItem);

router.route("/:id").post(ac.authorizeAdmin, requireId, updateItem);

router.route("/:id").delete(ac.authorizeAdmin, requireId, deleteItem);

module.exports = router;
