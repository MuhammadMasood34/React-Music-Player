import mongoose, { Document, Schema } from 'mongoose'

export interface IRoomParticipant {
    clientId: string
    userName: string
    lastSeen: Date
}

export interface IRoomCommand {
    id: string
    type: string
    sourceId: string
    sentAt: Date
    payload: Record<string, unknown>
}

export interface IRoomTrack {
    id?: string
    name: string
    uri: string
    durationMs?: number
    artistName?: string
    albumImageUrl?: string
}

export interface IRoom extends Document {
    code: string
    hostClientId: string
    participants: IRoomParticipant[]
    sharedPlaylist: IRoomTrack[]
    lastCommand?: IRoomCommand
    isActive: boolean
    expiresAt: Date
}

const roomParticipantSchema = new Schema<IRoomParticipant>(
    {
        clientId: { type: String, required: true },
        userName: { type: String, default: 'Guest' },
        lastSeen: { type: Date, default: Date.now }
    },
    { _id: false }
)

const roomCommandSchema = new Schema<IRoomCommand>(
    {
        id: { type: String, required: true },
        type: { type: String, required: true },
        sourceId: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
        payload: { type: Schema.Types.Mixed, default: {} }
    },
    { _id: false }
)

const roomTrackSchema = new Schema<IRoomTrack>(
    {
        id: { type: String },
        name: { type: String, required: true },
        uri: { type: String, required: true },
        durationMs: { type: Number },
        artistName: { type: String },
        albumImageUrl: { type: String }
    },
    { _id: false }
)

const roomSchema = new Schema<IRoom>(
    {
        code: { type: String, required: true, unique: true, index: true },
        hostClientId: { type: String, required: true },
        participants: { type: [roomParticipantSchema], default: [] },
        sharedPlaylist: { type: [roomTrackSchema], default: [] },
        lastCommand: { type: roomCommandSchema, required: false },
        isActive: { type: Boolean, default: true, index: true },
        expiresAt: { type: Date, required: true, index: { expires: 0 } }
    },
    { timestamps: true }
)

export default mongoose.model<IRoom>('Room', roomSchema)
