const sessionStates = {
    awaitingSessionRequest: 0,
    awaitingLogin: 1,
    loggedIn: 2,
    invalid: 3
}

Object.freeze(sessionStates)

module.exports = sessionStates
