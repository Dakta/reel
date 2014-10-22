
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')

var accountSchema = new mongoose.Schema({
    provider: String, // currently one of 'twitter' or 'email'
    provider_id: Number, // oauthID or email address
    created: Date
})

// and model
mongoose.model('Account', accountSchema)
