admin: {
    _id:
    username: String,
    password: String,
    userType: ['Admin', 'Judge'],
    firstNmae: String,
    lastName: String,
    isActive: Boolean,
}

configuration: {
    _id: 1,
    eventTitle: String,
    eventDescription: String,
    liveStatus: {
        categoryActive: id,
        contestantActive: id,
    }
}


categories: {
    _id:
    name: String,
    description: String,
    weight: int(0-100%),
    isActive: Boolean,
    rubrics: [{
        _id: ,
        name: String,
        maxPoints: Int,
    }]
}

contestantGroup: {
    _id:
    name: String,
    categoriesIncluded: [categoriesId]
}

contestants: {
    _id
    name: String,
    label: String,
    image: String,
    group: contestantsGroupId
}

judgesScore: {
    judgeId: id,
    categoryid: id,
    rubricsScore: [
        {
            rubricsId: id,
            score: Integer
        }
    ]
}

loginSession: {
    userId: id,
    generatedToken: String,
    date_added: Date,
    date_expire: Date,
}