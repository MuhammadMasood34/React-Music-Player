import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { corsMethods, corsOrigins } from '../config/cors'
import Room, { IRoom, IRoomTrack } from '../APIs/rooms/models/room.model'

const ROOM_TTL_HOURS = 12
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

type RoomPayload = {
    code?: string
    clientId?: string
    userName?: string
}

type RoomCommandPayload = {
    roomCode?: string
    clientId?: string
    command?: Record<string, unknown>
}

type RoomPlaylistPayload = {
    roomCode?: string
    clientId?: string
    tracks?: IRoomTrack[]
}

type AckCallback = (response: {
    ok: boolean
    room?: IRoom
    command?: Record<string, unknown>
    message?: string
}) => void

const activeRooms = new Map<string, Map<string, Set<string>>>()

const normalizeRoomCode = (code: string): string => code.trim().toUpperCase()

const createRoomCode = (): string => {
    let code = ''

    for (let index = 0; index < 6; index += 1) {
        code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)]
    }

    return code
}

const createUniqueRoomCode = async (): Promise<string> => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const code = createRoomCode()
        const existingRoom = await Room.exists({ code })

        if (!existingRoom) {
            return code
        }
    }

    throw new Error('Could not create a unique room code')
}

const addActiveClient = (roomCode: string, clientId: string, socketId: string): void => {
    const roomClients = activeRooms.get(roomCode) ?? new Map<string, Set<string>>()
    const clientSockets = roomClients.get(clientId) ?? new Set<string>()

    clientSockets.add(socketId)
    roomClients.set(clientId, clientSockets)
    activeRooms.set(roomCode, roomClients)
}

const removeActiveSocket = (socket: Socket): string[] => {
    const affectedRooms: string[] = []

    activeRooms.forEach((roomClients, roomCode) => {
        roomClients.forEach((clientSockets, clientId) => {
            if (clientSockets.delete(socket.id)) {
                affectedRooms.push(roomCode)
            }

            if (clientSockets.size === 0) {
                roomClients.delete(clientId)
            }
        })

        if (roomClients.size === 0) {
            activeRooms.delete(roomCode)
        }
    })

    return [...new Set(affectedRooms)]
}

const getActiveUserCount = (roomCode: string): number => activeRooms.get(roomCode)?.size ?? 0

const upsertParticipant = async (room: IRoom, clientId: string, userName = 'Guest'): Promise<IRoom> => {
    room.participants = [
        ...room.participants.filter((participant) => participant.clientId !== clientId),
        {
            clientId,
            userName,
            lastSeen: new Date()
        }
    ]

    return room.save()
}

const emitRoomState = (io: Server, room: IRoom): void => {
    io.to(room.code).emit('room:state', {
        code: room.code,
        userCount: getActiveUserCount(room.code),
        participants: room.participants,
        sharedPlaylist: room.sharedPlaylist,
        lastCommand: room.lastCommand ?? null
    })
}

const joinSocketRoom = async (
    io: Server,
    socket: Socket,
    room: IRoom,
    clientId: string,
    userName?: string
): Promise<IRoom> => {
    socket.join(room.code)
    addActiveClient(room.code, clientId, socket.id)
    socket.data.roomCode = room.code
    socket.data.clientId = clientId

    const updatedRoom = await upsertParticipant(room, clientId, userName)
    emitRoomState(io, updatedRoom)

    return updatedRoom
}

export const initializeRoomSocket = (httpServer: HttpServer): Server => {
    const io = new Server(httpServer, {
        cors: {
            origin: corsOrigins,
            methods: corsMethods,
            credentials: true
        }
    })

    io.on('connection', (socket) => {
        socket.on('room:create', async (payload: RoomPayload, callback?: AckCallback) => {
            try {
                if (!payload.clientId) {
                    throw new Error('clientId is required')
                }

                const code = await createUniqueRoomCode()
                const room = await Room.create({
                    code,
                    hostClientId: payload.clientId,
                    participants: [],
                    sharedPlaylist: [],
                    expiresAt: new Date(Date.now() + ROOM_TTL_HOURS * 60 * 60 * 1000)
                })

                const updatedRoom = await joinSocketRoom(io, socket, room, payload.clientId, payload.userName)
                callback?.({ ok: true, room: updatedRoom })
            } catch (error) {
                callback?.({ ok: false, message: error instanceof Error ? error.message : 'Could not create room' })
            }
        })

        socket.on('room:join', async (payload: RoomPayload, callback?: AckCallback) => {
            try {
                if (!payload.code || !payload.clientId) {
                    throw new Error('Room code and clientId are required')
                }

                const code = normalizeRoomCode(payload.code)
                const room = await Room.findOne({ code, isActive: true })

                if (!room) {
                    throw new Error('Room not found')
                }

                const updatedRoom = await joinSocketRoom(io, socket, room, payload.clientId, payload.userName)
                callback?.({ ok: true, room: updatedRoom })
            } catch (error) {
                callback?.({ ok: false, message: error instanceof Error ? error.message : 'Could not join room' })
            }
        })

        socket.on('room:leave', async (payload: RoomPayload, callback?: AckCallback) => {
            const code = payload.code ? normalizeRoomCode(payload.code) : socket.data.roomCode

            if (code) {
                socket.leave(code)
            }

            removeActiveSocket(socket)
            const room = code ? await Room.findOne({ code }) : null

            if (room) {
                emitRoomState(io, room)
            }

            callback?.({ ok: true })
        })

        socket.on('room:playlist', async (payload: RoomPlaylistPayload, callback?: AckCallback) => {
            try {
                if (!payload.roomCode || !payload.clientId || !payload.tracks) {
                    throw new Error('roomCode, clientId and tracks are required')
                }

                const code = normalizeRoomCode(payload.roomCode)
                const room = await Room.findOne({ code, isActive: true })

                if (!room) {
                    throw new Error('Room not found')
                }

                room.sharedPlaylist = payload.tracks
                    .filter((track) => track.uri && track.name)
                    .slice(0, 100)
                await room.save()

                emitRoomState(io, room)
                callback?.({ ok: true, room })
            } catch (error) {
                callback?.({ ok: false, message: error instanceof Error ? error.message : 'Could not share playlist' })
            }
        })

        socket.on('room:command', async (payload: RoomCommandPayload, callback?: AckCallback) => {
            try {
                if (!payload.roomCode || !payload.clientId || !payload.command?.type) {
                    throw new Error('roomCode, clientId and command.type are required')
                }

                const code = normalizeRoomCode(payload.roomCode)
                const room = await Room.findOne({ code, isActive: true })

                if (!room) {
                    throw new Error('Room not found')
                }

                const command = {
                    id:
                        typeof payload.command.id === 'string'
                            ? payload.command.id
                            : `${Date.now()}-${Math.random()}`,
                    type: String(payload.command.type),
                    sourceId: payload.clientId,
                    sentAt: new Date(),
                    payload: payload.command
                }

                room.lastCommand = command
                await room.save()

                socket.to(code).emit('room:command', {
                    ...payload.command,
                    id: command.id,
                    roomCode: code,
                    sourceId: payload.clientId,
                    sentAt: command.sentAt.getTime()
                })

                callback?.({ ok: true, command })
            } catch (error) {
                callback?.({ ok: false, message: error instanceof Error ? error.message : 'Could not send command' })
            }
        })

        socket.on('disconnect', async () => {
            const affectedRoomCodes = removeActiveSocket(socket)

            await Promise.all(
                affectedRoomCodes.map(async (roomCode) => {
                    const room = await Room.findOne({ code: roomCode })

                    if (room) {
                        emitRoomState(io, room)
                    }
                })
            )
        })
    })

    return io
}
