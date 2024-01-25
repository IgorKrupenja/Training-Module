import Handlebars from 'handlebars';

Handlebars.registerHelper('toJSON', function(obj) {
    return JSON.stringify(obj);
});

Handlebars.registerHelper('eq', function(a, b) {
    return a == b;
});


Handlebars.registerHelper('extractSlotKeys', function(obj) {
    const keys = [];
    console.log(obj)

    function iterate(obj) {
        for (const key in obj) {
            keys.push(key)
        }
    }

    iterate(obj);

    return keys;
});

Handlebars.registerHelper('getObjectKeys', function(obj) {
    console.log('OBJECT')
    console.log(obj)
    console.log(Object.keys(obj))
    return Object.keys(obj);
});

Handlebars.registerHelper('ne', function(a, b) {
    return a !== b;
});

Handlebars.registerHelper('valueExists', function(array, value) {
    return array.includes(value);
})

Handlebars.registerHelper('removeEntityFromArray', function (entities, entityToRemove) {
    const index = entities.indexOf(entityToRemove);
    if(index > -1) {
        entities.splice(index, 1);
    }
    return entities
});

Handlebars.registerHelper('assign', function(varName, varValue, options) {
    if (!options.data.root) {
        options.data.root = {};
    }
    options.data.root[varName] = varValue;
});

Handlebars.registerHelper('sortEntities', function (entities) {
    return entities.sort((a,b) => a.name > b.name ? 1 : -1);
});

Handlebars.registerHelper('isInModel', function(intentTitle, intents) {
    const inModelIntents = intents?.inmodel;
    return Array.isArray(inModelIntents) ? inModelIntents.includes(intentTitle) : false;
});

Handlebars.registerHelper('getCount', function(intentTitle, intents) {
    const intentCounts = intents.count;
    const intentCount = intentCounts?.find(intent => intent.key === intentTitle)?.examples_counts?.value;
    return intentCount || 0;
});

Handlebars.registerHelper('isType', function (type, value) {
    return typeof value === type;
});

export default Handlebars.helpers;
