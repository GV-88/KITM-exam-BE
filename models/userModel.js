const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { userRoles } = require("../constants/userRoles");
const { msgCodes } = require("../constants/msgCodes");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, msgCodes.USER_VALIDATION_REQUIRE_NAME],
      unique: true,
    },
    role: {
      type: String,
      default: userRoles.USER,
      enum: {
        values: Object.values(userRoles),
        message: msgCodes.USER_VALIDATION_ROLE_ENUM,
      },
    },
    password: {
      type: String,
      required: [true, msgCodes.USER_VALIDATION_REQUIRE_PASSWORD],
      minlength: [8, msgCodes.USER_VALIDATION_PASSWORD_LENGTH],
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now, //function
      select: false,
    },
    lastSignOutAt: {
      type: Date,
      default: Date.now, //function
      select: false,
    },
  },
  { timestamps: true }
);

const encrypt = async function (str) {
  return await bcrypt.hash(str, 12);
};

// middleware for password encryption
// "save" is a document middleware, not a query middleware;
// it only works when modification is applied on a tangible document;
// do not expect it to work with findAndUpdate
// https://mongoosejs.com/docs/middleware.html#notes
// "all pre('validate') and post('validate') hooks get called before any pre('save') hooks" (https://mongoosejs.com/docs/middleware.html#order)
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await encrypt(this.password);
    this.passwordChangedAt = Date.now();
  }
  next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
  const upd = this.getUpdate();
  if ("password" in upd) {
    // there is one inaccuracy here:
    //  change is always registered blindly, without checking against previous value
    const encryptedPassword = await encrypt(upd.password);
    //PROBLEM!!! minlength validation does not work properly because the value is encrypted already???
    this.setUpdate(
      Object.assign(upd, {
        password: encryptedPassword,
        passwordChangedAt: Date.now(),
      })
    );
  }
  next();
});

userSchema.pre("findOneAndDelete", async function (next) {
  //TODO: remove deleted user ID from events
  //const queryFilter = this.getFilter();
  //console.log(queryFilter); // { _id: '67ec85ede7eb4085dea14e22' }
  next();
});

userSchema.methods.checkPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Checks if token is older than changed password or last sign out
 * @param {*} JWTTimestamp time when the token was issued, IN SECONDS
 * @returns {boolean} true if token is out of date with changed password
 */
userSchema.methods.isTokenInvalidated = function (JWTTimestamp) {
  if (this.passwordChangedAt || this.lastSignOutAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
    const signoutTimestamp = this.lastSignOutAt.getTime() / 1000;
    return JWTTimestamp < changedTimestamp || JWTTimestamp < signoutTimestamp;
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
