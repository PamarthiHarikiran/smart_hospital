const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Doctor full name is required'],
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
      minlength: [6, 'Password must be at least 6 characters long'],
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
      default: 'DOCTOR',
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      enum: {
        values: [
          'Cardiology',
          'Neurology',
          'Orthopedics',
          'Pediatrics',
          'Dermatology',
          'General Medicine',
        ],
        message: '{VALUE} is not a supported clinical specialization',
      },
      trim: true,
    },
    qualification: {
      type: String,
      required: [true, 'Medical qualification is required (e.g., MBBS, MD)'],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'Years of clinical experience is required'],
      default: 0,
      min: [0, 'Experience cannot be negative'],
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      default: 50,
      min: [0, 'Fee cannot be negative'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    address: {
      type: String,
      trim: true,
      default: 'EliteCare Clinical Wing',
    },
    profileImage: {
      type: String,
      default: '',
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

// Hash password before saving
doctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
doctorSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Doctor', doctorSchema);
