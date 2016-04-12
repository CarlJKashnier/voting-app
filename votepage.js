var mongoose = require('mongoose');
var voteSchema = mongoose.Schema({
    vote: {
        voteid: Number,
        topic: String,
        options: Object,
        user: String,
        voters: Object
    },
});
//add to git hub
module.exports = mongoose.model('vote', voteSchema);
