
const express = require('express')
const mongoose = require('mongoose')
const Team = require('../models/team')
const protect = require('../middleware/auth')

const crypto = require('node:crypto')

const router = express.Router()

function generateInviteCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase()
}

router.use(protect)

// POST /api/teams - Create a team
router.post('/', async (req, res) => {
    try {
        const { name } = req.body

        if (
            typeof name !== 'string' ||
            name.trim().length < 2 ||
            name.trim().length > 80
        ) {
            return res.status(400).json({
                success: false,
                message: 'Team name must be between 2 and 80 characters',
            })
        }

        const team = await Team.create({
            name: name.trim(),
            inviteCode: generateInviteCode(),
            owner: req.user._id,
            members: [
                {
                    user: req.user._id,
                    role: 'owner',
                },
            ],
        })

        return res.status(201).json({
            success: true,
            message: 'Team created successfully',
            team: {
                _id: team._id,
                name: team.name,
                inviteCode: team.inviteCode,
            },
        })
    } catch (error) {
        console.error('Create team error:', error.message)

        return res.status(500).json({
            success: false,
            message: 'Unable to create team',
        })
    }
})

// GET /api/teams - List teams for the logged-in user
router.get('/', async (req, res) => {
    try {
        const teams = await Team.find({
            'members.user': req.user._id,
        })
            .select('_id name members.user members.role')
            .sort({ createdAt: -1 })

        const teamsWithRole = teams.map((team) => {
            const membership = team.members.find(
                (member) => member.user.equals(req.user._id)
            )

            return {
                _id: team._id,
                name: team.name,
                role: membership?.role,
            }
        })

        return res.status(200).json({
            success: true,
            count: teamsWithRole.length,
            teams: teamsWithRole,
        })
    } catch (error) {
        console.error('Fetch teams error:', error.message)

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch teams',
        })
    }
})

// POST /api/teams/join - Join a team using an invitation code
router.post('/join', async (req, res) => {
    try {
        const inviteCode =
            typeof req.body.inviteCode === 'string'
                ? req.body.inviteCode.trim().toUpperCase()
                : ''

        if (!/^[A-F0-9]{8}$/.test(inviteCode)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 8-character invitation code.',
            })
        }

        const team = await Team.findOne({ inviteCode })

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Invalid invitation code.',
            })
        }

        const alreadyMember = team.members.some(
            (member) => member.user.toString() === req.user._id.toString()
        )

        if (alreadyMember) {
            return res.status(409).json({
                success: false,
                message: 'You are already a member of this team.',
            })
        }

        team.members.push({
            user: req.user._id,
            role: 'member',
        })

        await team.save()

        return res.status(200).json({
            success: true,
            message: 'You joined the team successfully.',
            team: {
                _id: team._id,
                name: team.name,
            },
        })
    } catch (error) {
        console.error('Join team error:', error.message)

        return res.status(500).json({
            success: false,
            message: 'Unable to join the team.',
        })
    }
})

module.exports = router
