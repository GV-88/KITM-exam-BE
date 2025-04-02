const BasicCRUDController = require("./basicCRUDController");
const Model = require("../models/userModel");

class UserController extends BasicCRUDController {
  constructor() {
    super(Model);
  }
}

module.exports = UserController;
