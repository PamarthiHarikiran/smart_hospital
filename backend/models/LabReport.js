const mongoose = require('mongoose');

const labParameterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Parameter name is required'],
      trim: true,
    },
    value: {
      type: String,
      required: [true, 'Parameter value is required'],
      trim: true,
    },
    unit: {
      type: String,
      default: '',
      trim: true,
    },
    referenceRange: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'LOW', 'CRITICAL_HIGH', 'CRITICAL_LOW', 'ABNORMAL'],
      default: 'NORMAL',
    },
    interpretation: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: String,
      default: 'System',
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const labReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient is required'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor is required'],
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    testName: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
    },
    testCategory: {
      type: String,
      default: 'Clinical Pathology',
      trim: true,
    },
    testDescription: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Test price is required'],
      min: 0,
      default: 0,
    },
    requestStatus: {
      type: String,
      enum: [
        'REQUESTED',
        'SAMPLE_COLLECTED',
        'PROCESSING',
        'COMPLETED',
        'VERIFIED',
        'CANCELLED',
      ],
      default: 'REQUESTED',
    },
    sampleType: {
      type: String,
      default: 'Whole Blood (EDTA)',
      trim: true,
    },
    sampleCollectedAt: {
      type: Date,
    },
    sampleCollectedBy: {
      type: String,
      default: '',
      trim: true,
    },
    laboratory: {
      name: {
        type: String,
        default: 'EliteCare Central Diagnostic & Pathology Laboratory',
      },
      accreditation: {
        type: String,
        default: 'NABL & CAP Accredited Clinical Laboratory',
      },
      phone: {
        type: String,
        default: '+1 (800) 555-0199 / Ext. 402',
      },
      email: {
        type: String,
        default: 'pathology@elitecarehospital.com',
      },
      address: {
        type: String,
        default: 'EliteCare Medical Center, Diagnostic Tower Level 2, Suite 210',
      },
    },
    parameters: [labParameterSchema],
    result: {
      type: String,
      default: '',
      trim: true,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    verifiedBy: {
      name: {
        type: String,
        default: '',
        trim: true,
      },
      designation: {
        type: String,
        default: 'Chief Consultant Pathologist',
        trim: true,
      },
      licenseNumber: {
        type: String,
        default: 'MED-PATH-88492',
        trim: true,
      },
    },
    verifiedAt: {
      type: Date,
    },
    technician: {
      name: {
        type: String,
        default: 'Sarah Jenkins, MLT',
        trim: true,
      },
      role: {
        type: String,
        default: 'Senior Medical Laboratory Technologist',
        trim: true,
      },
    },
    reportFile: {
      type: String,
      default: '',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processingStartedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Auto-generate reportId before save if missing
labReportSchema.pre('save', function (next) {
  if (!this.reportId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().getFullYear();
    const idSnippet = this._id ? this._id.toString().slice(-4).toUpperCase() : randomSuffix;
    this.reportId = `ELC-LAB-${dateStr}-${idSnippet}`;
  }

  // Ensure initial status history entry exists
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [
      {
        status: this.requestStatus,
        timestamp: this.requestedAt || new Date(),
        updatedBy: 'System / Attending Doctor',
        note: `Initial test order logged: ${this.testName}`,
      },
    ];
  }

  next();
});

labReportSchema.index({ patient: 1, requestStatus: 1 });
labReportSchema.index({ doctor: 1 });

const LabReport = mongoose.model('LabReport', labReportSchema);
module.exports = LabReport;
