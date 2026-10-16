
import { useCallback, useEffect, useState } from 'react'
import API_BASE_URL from '../api';

const statusStyles = {
    Open: 'bg-blue-50 text-blue-700',
    'In Progress': 'bg-amber-50 text-amber-700',
    Resolved: 'bg-emerald-50 text-emerald-700',
    Closed: 'bg-slate-100 text-slate-600',
}

const priorityStyles = {
    Low: 'text-slate-500',
    Medium: 'text-blue-600',
    High: 'text-orange-600',
    Critical: 'text-red-600',
}

function StatCard({ label, value, detail, color }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {value}
            </p>
            <p className={`mt-2 text-xs font-medium ${color}`}>{detail}</p>
        </article>
    )
}

export default function Dashboard({ session, onLogout }) {
    const [bugs, setBugs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [priority, setPriority] = useState('')


    const [teams, setTeams] = useState([])
    const [selectedTeamId, setSelectedTeamId] = useState('')
    const [teamsLoading, setTeamsLoading] = useState(true)
    const selectedTeamRole = teams.find((team) => team._id === selectedTeamId)?.role
    const canManageBugs = selectedTeamRole === 'owner' || selectedTeamRole === 'admin'

    const [showCreateTeamForm, setShowCreateTeamForm] = useState(false)
    const [newTeamName, setNewTeamName] = useState('')
    const [creatingTeam, setCreatingTeam] = useState(false)
    const [teamError, setTeamError] = useState('')
    const [teamSuccess, setTeamSuccess] = useState('')
    const [teamInviteCode, setTeamInviteCode] = useState('')

    const [showJoinTeamForm, setShowJoinTeamForm] = useState(false)
    const [inviteCode, setInviteCode] = useState('')
    const [joiningTeam, setJoiningTeam] = useState(false)


    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingBug, setEditingBug] = useState(null)
    const [newBug, setNewBug] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Open',
    })
    const [createError, setCreateError] = useState('')
    const [creating, setCreating] = useState(false)


    const loadTeams = useCallback(async () => {
        setTeamsLoading(true)

        try {
            const response = await fetch(`${API_BASE_URL}/api/teams`, {
                headers: {
                    Authorization: `Bearer ${session.token}`,
                },
            })

            const data = await response.json()

            if (response.status === 401) {
                onLogout()
                return
            }

            if (!response.ok) {
                throw new Error(data.message || 'Could not load teams.')
            }

            const availableTeams = Array.isArray(data.teams) ? data.teams : []
            setTeams(availableTeams)

            setSelectedTeamId((currentId) => {
                if (availableTeams.some((team) => team._id === currentId)) {
                    return currentId
                }

                return availableTeams[0]?._id || ''
            })
        } catch (err) {
            setError(err.message || 'Unable to load teams.')
        } finally {
            setTeamsLoading(false)
        }
    }, [session.token, onLogout])


    async function handleCreateTeam(event) {
        event.preventDefault()

        const name = newTeamName.trim()

        if (name.length < 2 || name.length > 80) {
            setTeamError('Team name must be between 2 and 80 characters.')
            return
        }

        setCreatingTeam(true)
        setTeamError('')
        setTeamSuccess('')

        try {
            const response = await fetch(`${API_BASE_URL}/api/teams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.token}`,
                },
                body: JSON.stringify({ name }),
            })

            const data = await response.json()

            if (response.status === 401) {
                onLogout()
                return
            }

            if (!response.ok) {
                throw new Error(data.message || 'Could not create the team.')
            }

            setNewTeamName('')
            setShowCreateTeamForm(false)
            setTeamInviteCode(data.team?.inviteCode || '')
            setTeamSuccess('Team created successfully.')

            await loadTeams()
        } catch (err) {
            setTeamError(err.message || 'Unable to create the team.')
        } finally {
            setCreatingTeam(false)
        }
    }

    async function handleJoinTeam(event) {
        event.preventDefault()

        const code = inviteCode.trim().toUpperCase()

        if (!/^[A-F0-9]{8}$/.test(code)) {
            setTeamError('Enter a valid 8-character invitation code.')
            return
        }

        setJoiningTeam(true)
        setTeamError('')
        setTeamSuccess('')

        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.token}`,
                },
                body: JSON.stringify({ inviteCode: code }),
            })

            const data = await response.json()

            if (response.status === 401) {
                onLogout()
                return
            }

            if (!response.ok) {
                throw new Error(data.message || 'Could not join the team.')
            }

            setInviteCode('')
            setShowJoinTeamForm(false)
            setTeamSuccess('You joined the team successfully.')

            await loadTeams()

            if (data.team?._id) {
                setSelectedTeamId(data.team._id)
            }
        } catch (err) {
            setTeamError(err.message || 'Unable to join the team.')
        } finally {
            setJoiningTeam(false)
        }
    }


    const loadBugs = useCallback(async () => {
        if (!selectedTeamId) {
            setBugs([])
            setLoading(false)
            return
        }
        setLoading(true)
        setError('')

        try {
            const params = new URLSearchParams()
            if (selectedTeamId) params.set('teamId', selectedTeamId)
            if (search.trim()) params.set('search', search.trim())
            if (status) params.set('status', status)
            if (priority) params.set('priority', priority)

            const response = await fetch(
                `${API_BASE_URL}/api/bugs?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${session.token}`,
                    },
                }
            )

            const data = await response.json()

            if (response.status === 401) {
                onLogout()
                return
            }

            if (!response.ok) {
                throw new Error(data.message || 'Could not load bugs.')
            }

            setBugs(Array.isArray(data.bugs) ? data.bugs : [])
        } catch (err) {
            setError(err.message || 'Unable to connect to the server.')
        } finally {
            setLoading(false)
        }
    }, [session.token, search, status, priority, selectedTeamId, onLogout])

    async function handleCreateBug(event) {
        event.preventDefault()
        if (!selectedTeamId) {
            setCreateError('Please select a team before creating a bug.')
            return
        }
        setCreating(true)
        setCreateError('')

        try {
            const response = await fetch(`${API_BASE_URL}/api/bugs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.token}`,
                },
                body: JSON.stringify({ ...newBug, teamId: selectedTeamId, }),
            })

            const data = await response.json()

            if (response.status === 401) {
                onLogout()
                return
            }

            if (!response.ok) {
                throw new Error(data.message || 'Could not create the bug.')
            }

            setNewBug({
                title: '',
                description: '',
                priority: 'Medium',
                status: 'Open',
            })
            setShowCreateForm(false)
            await loadBugs()
        } catch (err) {
            setCreateError(err.message || 'Unable to create the bug.')
        } finally {
            setCreating(false)
        }
    }

    function handleEditClick(bug) {
        setEditingBug(bug)
        setNewBug({
            title: bug.title || '',
            description: bug.description || '',
            priority: bug.priority || 'Medium',
            status: bug.status || 'Open',
        })
        setCreateError('')
        setShowCreateForm(true)
    }

    async function handleUpdateBug(event) {
        event.preventDefault()

        if (!editingBug) return

        setCreating(true)
        setCreateError('')

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/bugs/${editingBug._id}?teamId=${encodeURIComponent(selectedTeamId)}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.token}`,
                    },
                    body: JSON.stringify(newBug),
                }
            )

            const data = await response.json()

            if (response.status === 401) {
                onLogout()
                return
            }

            if (!response.ok) {
                throw new Error(data.message || 'Could not update the bug.')
            }

            setEditingBug(null)
            setNewBug({
                title: '',
                description: '',
                priority: 'Medium',
                status: 'Open',
            })
            setShowCreateForm(false)

            await loadBugs()
        } catch (err) {
            setCreateError(err.message || 'Unable to update the bug.')
        } finally {
            setCreating(false)
        }
    }

    async function handleDeleteBug(bug) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${bug.title}"? This action cannot be undone.`
        )

        if (!confirmed) return

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/bugs/${bug._id}?teamId=${encodeURIComponent(selectedTeamId)}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${session.token}`,
                    },
                }
            )

            const data = await response.json()

            if (response.status === 401) {
                onLogout()
                return
            }

            if (!response.ok) {
                throw new Error(data.message || 'Could not delete the bug.')
            }

            await loadBugs()
        } catch (err) {
            setError(err.message || 'Unable to delete the bug.')
        }
    }



    useEffect(() => {
        loadTeams()
    }, [loadTeams])

    useEffect(() => {
        if (!teamsLoading) {
            loadBugs()
        }
    }, [teamsLoading, selectedTeamId, loadBugs])

    const total = bugs.length
    const openCount = bugs.filter((bug) => bug.status === 'Open').length
    const progressCount = bugs.filter((bug) => bug.status === 'In Progress').length
    const resolvedCount = bugs.filter(
        (bug) => bug.status === 'Resolved' || bug.status === 'Closed'
    ).length

    return (
        <div className="min-h-screen bg-slate-50 lg:flex">
            <aside className="flex w-full flex-col bg-slate-950 text-white lg:fixed lg:inset-y-0 lg:w-64">
                <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-lg font-extrabold">
                        B
                    </span>
                    <div>
                        <p className="font-bold tracking-tight">BugTrack Lite</p>
                        <p className="mt-0.5 text-xs text-slate-400">Issue management</p>
                    </div>
                </div>

                <nav className="flex gap-2 p-4 lg:flex-col">
                    <div className="flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold">
                        <span>▦</span> Dashboard
                    </div>
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400">
                        <span>◉</span> Bug reports
                    </div>
                </nav>

                <div className="mt-auto hidden border-t border-white/10 p-5 lg:block">
                    <p className="text-xs text-slate-400">SIGNED IN AS</p>
                    <p className="mt-2 truncate text-sm font-semibold">{session.user.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">{session.user.email}</p>
                    <button
                        onClick={onLogout}
                        className="mt-5 w-full rounded-lg border border-white/15 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            <main className="min-w-0 flex-1 p-5 sm:p-8 lg:ml-64 lg:p-10">

                <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
                    <label
                        htmlFor="team-selector"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                        Current team
                    </label>

                    {teamsLoading ? (
                        <p className="text-sm text-slate-500">Loading teams...</p>
                    ) : teams.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            You don't belong to a team yet.
                        </p>
                    ) : (
                        <select
                            id="team-selector"
                            value={selectedTeamId}
                            onChange={(event) => setSelectedTeamId(event.target.value)}
                            className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                        >
                            {teams.map((team) => (
                                <option key={team._id} value={team._id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    )}
                    <div className="mt-4 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowCreateTeamForm((current) => !current)
                                setTeamError('')
                                setTeamSuccess('')
                            }}
                            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            {showCreateTeamForm ? 'Cancel' : '+ Create Team'}
                        </button>

                        {showCreateTeamForm && (
                            <form onSubmit={handleCreateTeam} className="mt-4 max-w-md space-y-3">
                                <label
                                    htmlFor="new-team-name"
                                    className="block text-sm font-semibold text-slate-700"
                                >
                                    Team name
                                </label>

                                <input
                                    id="new-team-name"
                                    type="text"
                                    value={newTeamName}
                                    onChange={(event) => setNewTeamName(event.target.value)}
                                    placeholder="e.g. Development Team"
                                    minLength={2}
                                    maxLength={80}
                                    required
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                />

                                {teamError && (
                                    <p className="text-sm text-red-600">{teamError}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={creatingTeam}
                                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {creatingTeam ? 'Creating...' : 'Create Team'}
                                </button>
                            </form>
                        )}

                        {teamSuccess && (
                            <div className="mt-3 space-y-3">
                                <p className="text-sm text-emerald-600">{teamSuccess}</p>

                                {teamInviteCode && (
                                    <div className="max-w-md rounded-xl border border-blue-200 bg-blue-50 p-4">
                                        <p className="text-sm font-semibold text-slate-800">
                                            Team invitation code
                                        </p>

                                        <div className="mt-2 flex items-center gap-3">
                                            <code className="flex-1 rounded-lg bg-white px-3 py-2 font-mono text-lg font-bold tracking-wider text-blue-700">
                                                {teamInviteCode}
                                            </code>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(teamInviteCode)
                                                        .then(() => {
                                                            setTeamSuccess('Invitation code copied successfully.')
                                                        })
                                                        .catch(() => {
                                                            setTeamError('Could not copy the code. Please copy it manually.')
                                                        })
                                                }}
                                                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                            >
                                                Copy
                                            </button>
                                        </div>

                                        <p className="mt-2 text-xs text-slate-600">
                                            Share this code only with people you want to add to your team.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowJoinTeamForm((current) => !current)
                                setTeamError('')
                                setTeamSuccess('')
                            }}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            {showJoinTeamForm ? 'Cancel' : 'Join Team'}
                        </button>

                        {showJoinTeamForm && (
                            <form onSubmit={handleJoinTeam} className="mt-4 max-w-md space-y-3">
                                <label
                                    htmlFor="team-invite-code"
                                    className="block text-sm font-semibold text-slate-700"
                                >
                                    Invitation code
                                </label>

                                <input
                                    id="team-invite-code"
                                    type="text"
                                    value={inviteCode}
                                    onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                                    placeholder="e.g. A3F91C2B"
                                    minLength={8}
                                    maxLength={8}
                                    required
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:border-blue-500"
                                />

                                <button
                                    type="submit"
                                    disabled={joiningTeam}
                                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {joiningTeam ? 'Joining...' : 'Join Team'}
                                </button>
                            </form>
                        )}
                    </div>
                </section>

                <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-500">Workspace / Overview</p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                            Dashboard
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Here’s what’s happening with your reported issues.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={loadBugs}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                        >
                            ↻ Refresh
                        </button>

                        <button
                            onClick={() => {
                                setCreateError('')
                                setEditingBug(null)
                                setNewBug({
                                    title: '',
                                    description: '',
                                    priority: 'Medium',
                                    status: 'Open',
                                })
                                setShowCreateForm(true)
                            }}
                            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            + Create Bug
                        </button>
                    </div>
                </header>


                {showCreateForm && (
                    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingBug ? 'Edit bug' : 'Create a new bug'}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Report an issue and track its progress.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateForm(false)
                                    setCreateError('')
                                }}
                                className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={editingBug ? handleUpdateBug : handleCreateBug} className="grid gap-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Bug title *
                                </label>
                                <input
                                    type="text"
                                    value={newBug.title}
                                    onChange={(event) =>
                                        setNewBug({ ...newBug, title: event.target.value })
                                    }
                                    minLength={3}
                                    maxLength={120}
                                    placeholder="e.g. Login button not responding"
                                    required
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Description
                                </label>
                                <textarea
                                    value={newBug.description}
                                    onChange={(event) =>
                                        setNewBug({ ...newBug, description: event.target.value })
                                    }
                                    maxLength={3000}
                                    rows={4}
                                    placeholder="Describe the issue and how to reproduce it..."
                                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Priority
                                    </label>
                                    <select
                                        value={newBug.priority}
                                        onChange={(event) =>
                                            setNewBug({ ...newBug, priority: event.target.value })
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Status
                                    </label>
                                    <select
                                        value={newBug.status}
                                        onChange={(event) =>
                                            setNewBug({ ...newBug, status: event.target.value })
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                            </div>

                            {createError && (
                                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                    {createError}
                                </p>
                            )}

                            <div className="flex flex-wrap justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {creating ? editingBug ? 'Saving...' : 'Creating...' : editingBug ? 'Save changes' : 'Create bug'}
                                </button>
                            </div>
                        </form>
                    </section>
                )}


                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Matching bugs"
                        value={total}
                        detail="Current results"
                        color="text-slate-500"
                    />
                    <StatCard
                        label="Open"
                        value={openCount}
                        detail="Awaiting attention"
                        color="text-blue-600"
                    />
                    <StatCard
                        label="In progress"
                        value={progressCount}
                        detail="Currently being worked on"
                        color="text-amber-600"
                    />
                    <StatCard
                        label="Completed"
                        value={resolvedCount}
                        detail="Resolved or closed"
                        color="text-emerald-600"
                    />
                </section>

                <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 p-5 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Bug reports</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Search and filter your reported issues.
                                </p>
                            </div>
                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                {total} {total === 1 ? 'issue' : 'issues'}
                            </span>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search bug reports..."
                                className="min-w-0 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
                            >
                                <option value="">All statuses</option>
                                <option>Open</option>
                                <option>In Progress</option>
                                <option>Resolved</option>
                                <option>Closed</option>
                            </select>

                            <select
                                value={priority}
                                onChange={(event) => setPriority(event.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
                            >
                                <option value="">All priorities</option>
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Critical</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Issue</th>
                                    <th className="px-6 py-4 font-semibold">Priority</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Reported</th>
                                    <th className="px-6 py-4 font-semibold">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                            Loading bug reports...
                                        </td>
                                    </tr>
                                ) : bugs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <p className="font-semibold text-slate-700">No bug reports found</p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Try changing your filters or report a new issue.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    bugs.map((bug) => (
                                        <tr key={bug._id} className="transition hover:bg-slate-50/80">
                                            <td className="max-w-md px-6 py-5">
                                                <p className="font-semibold text-slate-800">{bug.title}</p>
                                                <p className="mt-1 truncate text-xs text-slate-500">
                                                    {bug.description || 'No description provided'}
                                                </p>
                                            </td>
                                            <td className={`px-6 py-5 font-semibold ${priorityStyles[bug.priority] || ''}`}>
                                                <span className="mr-2">●</span>{bug.priority}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[bug.status] || 'bg-slate-100 text-slate-600'}`}>
                                                    {bug.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-5 text-slate-500">
                                                {bug.createdAt
                                                    ? new Date(bug.createdAt).toLocaleDateString()
                                                    : '—'}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-5">
                                                {canManageBugs && <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditClick(bug)}
                                                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteBug(bug)}
                                                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>}
                                            </td>

                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <footer className="py-6 text-center text-xs text-slate-400">
                    BugTrack Lite · Keep issues moving forward.
                </footer>
            </main>

            <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white p-3 lg:hidden">
                <button
                    onClick={onLogout}
                    className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                    Sign out · {session.user.name}
                </button>
            </div>
        </div>
    )
}
