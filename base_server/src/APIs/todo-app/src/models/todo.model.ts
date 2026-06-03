import mongoose, { Document, Schema, Types } from 'mongoose'

export interface ITodo extends Document {
  user: Types.ObjectId
  title: string
  completed: boolean
}

const TodoSchema = new Schema<ITodo>({
  user:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:     { type: String, required: true },
  completed: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model<ITodo>('Todo', TodoSchema)