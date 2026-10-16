
const express = require('express')
const mongoose = require('mongoose')
const Bug = require('../models/bug')
const Team = require('../models/team')
const protect = require('../middleware/auth')

const router = express.Router()

router.use(protect)

const priorities = ['Low', 'Medium', 'High', 'Critical']
const statuses = ['Open', 'In Progress', 'Resolved', 'Closed']

// Verify that the logged-in user belongs to the requested team
async function verifyTeamMembership(teamId, userId) {
  if (!mongoose.isValidObjectId(teamId)) {
    return false
  }

  const team = await Team.exists({
    _id: teamId,
    'members.user': userId,
  })

  return Boolean(team)
}


async function verifyTeamAdmin(teamId, userId) {
  if (!mongoose.isValidObjectId(teamId)) {
    return false
  }

  const team = await Team.exists({
    _id: teamId,
    members: {
      $elemMatch: {
        user: userId,
        role: { $in: ['owner', 'admin'] },
      },
    },
  })

  return Boolean(team)
}


// GET /api/bugs - List bugs with search and filters


router.get('/', async (req, res) => {
  try {
    const { search, status, priority, teamId } = req.query

    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required',
      })
    }

    const isMember = await verifyTeamMembership(teamId, req.user._id)

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this team',
      })
    }


    if (status && !statuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status filter',
      })
    }

    if (priority && !priorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority filter',
      })
    }

    const filter = { team: teamId }


    if (status && statuses.includes(status)) {
      filter.status = status
    }

    if (priority && priorities.includes(priority)) {
      filter.priority = priority
    }

    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      filter.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
      ]
    }

    const bugs = await Bug.find(filter)
      .populate('assignee', 'name email')
      .populate('reporter', 'name email')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: bugs.length,
      bugs,
    })
  } catch (error) {
    console.error('Fetch bugs error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch bugs',
    })
  }
})



// GET /api/bugs/:id - Get one bug

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { teamId } = req.query

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bug ID',
      })
    }

    if (!teamId || !mongoose.isValidObjectId(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid team ID is required',
      })
    }

    const isMember = await verifyTeamMembership(teamId, req.user._id)

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this team',
      })
    }

    const bug = await Bug.findOne({
      _id: id,
      team: teamId,
    })
      .populate('assignee', 'name email')
      .populate('reporter', 'name email')

    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found',
      })
    }

    return res.status(200).json({ success: true, bug })
  } catch (error) {
    console.error('Fetch bug error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch bug',
    })
  }
})


// POST /api/bugs - Create a bug

router.post('/', async (req, res) => {
  try {
    const { title, description, priority, status, teamId } = req.body

    if (!teamId || !mongoose.isValidObjectId(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid team ID is required',
      })
    }

    const isMember = await verifyTeamMembership(teamId, req.user._id)

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this team',
      })
    }

    if (
      typeof title !== 'string' ||
      typeof description !== 'string' ||
      title.trim().length < 3 ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'A title of at least 3 characters and a description are required',
      })
    }

    if (title.trim().length > 120 || description.trim().length > 3000) {
      return res.status(400).json({
        success: false,
        message: 'Title or description exceeds the allowed length',
      })
    }

    if (priority && !priorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority',
      })
    }

    if (status && !statuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      })
    }

    const bug = await Bug.create({
      title: title.trim(),
      description: description.trim(),
      priority: priority || 'Medium',
      status: status || 'Open',
      reporter: req.user._id,
      team: teamId,
    })

    return res.status(201).json({
      success: true,
      message: 'Bug created successfully',
      bug,
    })
  } catch (error) {
    console.error('Create bug error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to create bug',
    })
  }
})


// PATCH /api/bugs/:id - Update a bug
router.patch('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bug ID',
      })
    }

    const allowedFields = ['title', 'description', 'priority', 'status']
    const updates = {}
    const providedFields = Object.keys(req.body)

    if (
      providedFields.length === 0 ||
      providedFields.some((field) => !allowedFields.includes(field))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Provide valid bug fields to update',
      })
    }

    if ('title' in req.body) {
      if (
        typeof req.body.title !== 'string' ||
        req.body.title.trim().length < 3 ||
        req.body.title.trim().length > 120
      ) {
        return res.status(400).json({
          success: false,
          message: 'Title must be between 3 and 120 characters',
        })
      }
      updates.title = req.body.title.trim()
    }

    if ('description' in req.body) {
      if (
        typeof req.body.description !== 'string' ||
        !req.body.description.trim() ||
        req.body.description.trim().length > 3000
      ) {
        return res.status(400).json({
          success: false,
          message: 'Description is required and must not exceed 3000 characters',
        })
      }
      updates.description = req.body.description.trim()
    }

    if ('priority' in req.body) {
      if (!priorities.includes(req.body.priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid priority',
        })
      }
      updates.priority = req.body.priority
    }

    if ('status' in req.body) {
      if (!statuses.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
        })
      }
      updates.status = req.body.status
    }


    const { teamId } = req.query

    if (!teamId || !mongoose.isValidObjectId(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid team ID is required',
      })
    }


    const isMember = await verifyTeamMembership(teamId, req.user._id)

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team',
      })
    }

    const isAdmin = await verifyTeamAdmin(teamId, req.user._id)

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only team owners and admins can update bugs',
      })
    }


    const bug = await Bug.findOneAndUpdate(
      {
        _id: req.params.id,
        team: teamId,
      },
      { $set: updates },
      { new: true, runValidators: true }
    )


    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Bug updated successfully',
      bug,
    })
  } catch (error) {
    console.error('Update bug error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to update bug',
    })
  }
})

// DELETE /api/bugs/:id - Delete a bug
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bug ID',
      })
    }


    const { teamId } = req.query

    if (!teamId || !mongoose.isValidObjectId(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid team ID is required',
      })
    }


    const isMember = await verifyTeamMembership(teamId, req.user._id)

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team',
      })
    }

    const isAdmin = await verifyTeamAdmin(teamId, req.user._id)

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only team owners and admins can delete bugs',
      })
    }



    const bug = await Bug.findOneAndDelete({
      _id: req.params.id,
      team: teamId,
    })


    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Bug deleted successfully',
    })
  } catch (error) {
    console.error('Delete bug error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to delete bug',
    })
  }
})

module.exports = router
