
const mongoose = require('mongoose')

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Team name is required'],
            trim: true,
            minlength: 2,
            maxlength: 80,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        inviteCode: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            uppercase: true,
        },
        members: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                role: {
                    type: String,
                    enum: ['owner', 'admin', 'member'],
                    default: 'member',
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
)

teamSchema.index({ 'members.user': 1 })

module.exports = mongoose.model('Team', teamSchema)
