const config = require('./../config')

const EventEmitter = require('events').EventEmitter
const uuid = require('uuid/v4')

const SessionState = require('./session-state')

const handlers = require('./packet/handlers')
const decode = require('./packet/decoder')
const senders = require('./packet/senders')
const opcodes = require('./packet/opcodes')

function attachListeners(session) {
    session.socket.on('close', () => session.emit('close'))
    session.socket.on('data', data => session.emit('data', data))
    session.socket.on('error', error => session.emit('error', error))
    session.socket.on('timeout', () => session.emit('timeout'))

    // TODO: move this somewhere else ? ... probably
    session.socket.on('data', async data => {
        const decoded = decode(data)

        console.log(`got packet: ${decoded.id}`)

        if (session.state === SessionState.awaitingSessionRequest
            && decoded.id !== opcodes.client.session) {
            console.warn(`invalid session state for packet ${decoded.id}`)
            return
        }
        if (session.state === SessionState.awaitingLogin
            && decoded.id !== opcodes.client.login) {
            console.warn(`invalid session state for packet ${decoded.id}`)
            return
        }

        if (!(decoded.id in handlers)) {
            console.warn(`no packet handler for ${decoded.id}`)
            return
        }

        try {
            await handlers[decoded.id](session, decoded.payload)
            console.log('handled packet', decoded.id)
        } catch (e) {
            session.emit('error', e)
        }
    })

    if (config.session.timeout) {
        session.socket.setTimeout(config.session.timeout)
    }
}

class Session extends EventEmitter {
    constructor(server, socket) {
        super()

        this.server = server
        this.socket = socket
        this.state = SessionState.awaitingSessionRequest

        this.send = senders(this)

        this.generateIdentifier()

        attachListeners(this)
    }

    close() {
        if (!this.socket.destroyed) {
            this.socket.destroy()
        }
    }

    async write(data) {
        return new Promise((resolve, reject) => {
            this.socket.write(data, () => resolve)
        })
    }

    generateIdentifier() {
        this.identifier = uuid()
    }

    toString() {
        return `Session[${this.identifier}]`
    }
}

module.exports = Session
