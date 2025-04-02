const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { promisify } = require("util"); // there are alternatives... https://www.npmjs.com/package/express-jwt
const bcrypt = require("bcryptjs");
const UserController = require("./userController");
const { sendJsonWithToken, sendJsonWithError } = require("../utils/utils");
const { msgCodes } = require("../constants/msgCodes");
const { userRoles } = require("../constants/userRoles");

const createToken = (id, expiresIn, encodeData = {}) => {
  return jwt.sign(
    Object.assign({ id: id }, encodeData ?? {}),
    process.env.JWT_SECRET,
    { expiresIn: expiresIn ?? process.env.JWT_EXPIRES_IN }
  );
};

const authorize = async (req, res, next, allowRoles) => {
  //1. Get token
  let token;
  try {
    if ((req.headers?.authorization ?? "").startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req?.query?.token) {
      token = req.query.token;
    }
    // console.log(token);
    if (!token) {
      res.status(401).json({
        msgCode: msgCodes.AUTH_REQUIRE_TOKEN,
        message: "You are not logged in",
      });
      return;
    }

    //2. Verify token
    // jsonwebtoken package provides interface for asynchronous verification with callback;
    // I see no way of error handling with callback within express route handler;
    // therefore need either promisify or use middleware from https://www.npmjs.com/package/express-jwt
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //3. Check corresponding user in DB
    const currentUser = await User.findById(decoded.id).select(
      "id role password passwordChangedAt lastSignOutAt"
    );
    if (!currentUser) {
      res.status(401).json({
        msgCode: msgCodes.USER_ID_NOT_FOUND,
        message: "User does not exist",
      });
      return;
    }

    //4. Deny access if token is older than changed password; changing password invalidates the old token
    if (currentUser.isTokenInvalidated(decoded.iat)) {
      res.status(401).json({
        msgCode: msgCodes.AUTH_TOKEN_INVALIDATED,
        message:
          "Token is no longer valid (due to sign out or password change)",
      });
      return;
    }

    //5. Issue a new token to refresh if current token is about to expire
    try {
      const nowSeconds = Math.floor(Date.now() / 1000);

      //TODO: robust time string parser
      // currently this works only if JWT_REFRESH_OVERLAP is specified in minutes!!!
      if (
        decoded.exp - nowSeconds <
        parseInt(process.env.JWT_REFRESH_OVERLAP, 10) * 60
      ) {
        res.newToken = createToken(currentUser.id);
        //"newToken" property is set to "res" object;
        // then we need to somehow add it to the json response body in some kind of "after" middleware?
      }
    } catch (error) {
      console.error("failed to generate refresh token");
      console.log(error);
    }

    //6. Deny access if corresponding user role is not in allowRoles whitelist
    if (Object.values(userRoles).includes(decoded?.specialRole)) {
      //is it a good idea to set value in this way?
      currentUser.role = decoded.specialRole;
    }

    if (allowRoles && !allowRoles.includes(currentUser.role.toString())) {
      res.status(403).json({
        msgCode: msgCodes.AUTH_RESTRICTED_ACCESS,
        message: "User does not have access",
      });
      return;
    }

    //7. Grant access (append user data to forwarded request)
    req.authorizedUser = currentUser; //dynamic mongoose object?
    next();
  } catch (error) {
    //any type of error resolves to 401 because this is authorization middleware
    res
      .status(401)
      .json({ msgCode: msgCodes.AUTH_FAIL, message: error.message });
  }
};

exports.authorizeAdmin = async (req, res, next) => {
  await authorize(req, res, next, [userRoles.ADMIN]);
};

exports.authorizeUser = async (req, res, next) => {
  await authorize(req, res, next, [userRoles.ADMIN, userRoles.USER]);
};

exports.login = async (req, res) => {
  try {
    let { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        msgCode: msgCodes.AUTH_REQUIRE_CREDENTIALS,
        message: "Please provide username and password",
      });
      return;
    }

    let user = await User.findOne({ username: username }).select("+password");

    if (!user) {
      res.status(400).json({
        msgCode: msgCodes.USER_NAME_NOT_FOUND,
        message: "Login failed (reason: username not found)",
      });
      return;
    }

    if (!(await user.checkPassword(password))) {
      res.status(400).json({
        msgCode: msgCodes.AUTH_PASSWORD_MISMATCH,
        message: "Login failed (reason: incorrect password)",
      });
      return;
    }

    res.newToken = createToken(user.id);

    sendJsonWithToken(res.status(200), {
      user: UserController.mapOutput(user),
    });
    return;
  } catch (error) {
    sendJsonWithError(res, error);
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.authorizedUser) {
      await User.findByIdAndUpdate(req.authorizedUser.id, {
        lastSignOutAt: Date.now(),
      });
    }
    res.status(204).send();
    return;
  } catch (error) {
    sendJsonWithError(res, error);
  }
};

exports.register = async (req, res) => {
  try {
    let { username, password, confirmPassword } = req.body;

    if (!username || !password || !confirmPassword) {
      res.status(400).json({
        msgCode: msgCodes.AUTH_REQUIRE_CREDENTIALS,
        message: "Please provide username and password",
      });
      return;
    }
    if (confirmPassword !== password) {
      res.status(400).json({
        msgCode: msgCodes.AUTH_PASSWORD_MISMATCH,
        message: "Failed to confirm new password",
      });
      return;
    }

    let user = await User.create({
      username: username,
      password: password,
    });

    res.newToken = createToken(user.id);

    sendJsonWithToken(res.status(200), {
      user: UserController.mapOutput(user),
    });
    return;
  } catch (error) {
    sendJsonWithError(res, error);
  }
};
