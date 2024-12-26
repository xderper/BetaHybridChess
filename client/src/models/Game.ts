import mongoose from 'mongoose'

const gameSchema = new mongoose.Schema({
    status: { type: String, required: true, default: 'waiting' },
    roomId: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
})

export const Game = mongoose.models.Game || mongoose.model('Game', gameSchema)
