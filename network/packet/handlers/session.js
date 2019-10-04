function secureInt() {
    return ~~(Math.random() & 0xFFFFFFFF)
}

module.exports.name = 'session'

module.exports.handle = (session, payload) => new Promise((resolve, reject) => {
    const packet = new Buffer(8)

    session.keys = [secureInt(), secureInt()]

    packet.writeInt32BE(session.keys[0], 0)
    packet.writeInt32BE(session.keys[1], 4)

    session.write(packet)
    resolve()
})
