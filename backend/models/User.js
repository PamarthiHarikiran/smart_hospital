const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-zA-Z0-9._%+-]+@gmail\.com$/, 'Please enter a valid @gmail.com email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      match: [
        /^(|[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15})$/,
        'Please fill a valid mobile/contact number',
      ],
    },
    role: {
      type: String,
      enum: ['PATIENT', 'DOCTOR', 'LAB', 'PHARMACY', 'ADMIN'],
      default: 'PATIENT',
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    // Doctor-specific fields (optional)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    specialization: {
      type: String,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    experience: {
      type: Number,
      default: 0,
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    availability: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        slots: [{ type: String }],
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
