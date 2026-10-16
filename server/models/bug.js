
const mongoose = require('mongoose')

const bugSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Bug title is required'],
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Bug description is required'],
      trim: true,
      maxlength: 3000,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

bugSchema.index({ team: 1, createdAt: -1 })

module.exports = mongoose.model('Bug', bugSchema)
