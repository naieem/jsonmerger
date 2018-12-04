var express = require('express');
var lodash = require('lodash');
var router = express.Router();
var fs = require('fs');
router.get('/', function(req, res, next) {
    res.status(200).json({
        message: 'yah it works'
    });
});
var newFilesData; // saves new files data
var oldFilesdata; // saves old files data
var newFilesKey = []; // holds new files all key
var oldFilesKey = []; // holds old files all key
/**
 * read new files data
 */
fs.readFile('./files/new.json', 'utf8', function(err, data) {
    newFilesData = JSON.parse(data);
    lodash.forEach(newFilesData, function(value, key) {
        newFilesKey.push(key);
    });
    console.log('new file read done');
});

/**
 * read old files data
 */
fs.readFile('./files/old.json', 'utf8', function(err, oldData) {
    oldFilesdata = JSON.parse(oldData);
    lodash.forEach(oldFilesdata, function(value, key) {
        oldFilesKey.push(key);
    });
    console.log('Old file read done');
});


router.get('/getExistingchanges', function(req, res, next) {

    getExistingchanges().then(function(result) {
        res.status(200).json({
            LatestChanges: {
                length: result.length,
                data: result
            },
            // olddatainfo: {
            //     length: oldFilesKey.length,
            //     data: oldFilesKey
            // },
            // newdata: {
            //     length: newFilesKey.length,
            //     data: newFilesKey
            // }
        });
    });

});

router.get('/getnewaddedchanges', function(req, res, next) {
    getnewaddedchanges().then(function(result) {
        res.status(200).json({
            newaddedchanges: {
                length: result.length,
                data: result
            },
            // olddatainfo: {
            //     length: oldFilesKey.length,
            //     data: oldFilesKey
            // },
            // newdata: {
            //     length: newFilesKey.length,
            //     data: newFilesKey
            // }
        });
    });
});

/**
 * return the merged files endpoint
 */
router.get('/getmergedFile', function(req, res, next) {
    getmergedFile().then(function(result) {
        // get newly added keys and append them to the old key
        if (result) {
            lodash.forEach(result, function(value, key) {
                oldFilesdata[key] = value;
            });
        }
        var dataTobewritten = JSON.stringify(oldFilesdata); // stringify the object to save in the file
        fs.writeFile('result/result.json', dataTobewritten, function(err) {
            if (err) {
                res.status(200).json({
                    message: err
                });
            } else {
                console.log('new merged file created!');
                res.status(200).json({
                    message: "new merged file created!",
                    data: oldFilesdata
                });
            }
        });
    });
});

/**
 * getting the merged file ready for future use
 */
function getmergedFile() {
    return new Promise(function(resolve, reject) {
        getExistingchanges().then(function(result) {
            // if there are exising data that changed
            if (result && result.length) {
                lodash.forEach(result, function(value) {
                    lodash.forEach(value.changes, function(langVal) {
                        oldFilesdata[value.key][langVal.lang] = langVal.newValue;
                    });
                });
                console.log('Existing value changes done');
            } else {
                console.log('No existing value changes found');
            }
            // return newly added keys
            getnewaddedchanges().then(function(result) {
                if (result && result.length) {
                    var newValues = {};
                    lodash.forEach(result, function(value) {
                        newValues[value.key] = value.value;
                    });
                }
                resolve(newValues);
            });
        });
    });
}

/**
 * getting existing changes keys
 * logic: check newfiles data with oldfiles data and return those keys which are
 * present in both the files but value getting changes
 */
function getExistingchanges() {
    var changedValue = [];
    return new Promise(function(resolve, reject) {
        lodash.forEach(newFilesData, function(value, key) {
            if (lodash.indexOf(oldFilesKey, key) > -1) {
                var langchanges = [];
                if (oldFilesdata[key]['en'] != value['en']) {
                    langchanges.push({
                        lang: 'en',
                        oldValue: oldFilesdata[key]['en'],
                        newValue: value['en']
                    });
                }
                if (oldFilesdata[key]['cz'] != value['cz']) {
                    langchanges.push({
                        lang: 'cz',
                        oldValue: oldFilesdata[key]['cz'],
                        newValue: value['cz']
                    });
                }
                if (oldFilesdata[key]['de'] != value['de']) {
                    langchanges.push({
                        lang: 'de',
                        oldValue: oldFilesdata[key]['de'],
                        newValue: value['de']
                    });
                }
                if (langchanges.length) {
                    var obj = {
                        key: key,
                        changes: langchanges.length ? langchanges : 'No changes found'
                    }
                    changedValue.push(obj)
                }
                // var obj = {
                //     key: key,
                //     language: langchanges.length ? langchanges : 'No changes found'
                // }
                // changedValue.push(obj)
            }
        });
        resolve(changedValue);
    });
}
/**
 * getting newly added changes keys
 * logic: check newfiles data with oldfiles data and return those keys which are
 * added new to the new file.
 */
function getnewaddedchanges() {
    return new Promise(function(resolve, reject) {
        var changedValue = [];
        lodash.forEach(newFilesData, function(value, key) {
            if (lodash.indexOf(oldFilesKey, key) == -1) {
                var langchanges = [];
                var obj = {
                    key: key,
                    value: value
                }
                changedValue.push(obj);
            }
        });
        resolve(changedValue);
    });
}

module.exports = router;