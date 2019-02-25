var express = require('express');
var lodash = require('lodash');
var router = express.Router();
var fs = require('fs');
var config = require('../config');
router.get('/', function(req, res, next) {
    res
        .status(200)
        .json({ message: 'yah it works' });
});
var newFilesData; // saves new files data
var oldFilesdata; // saves old files data
var newFilesKey = []; // holds new files all key
var oldFilesKey = []; // holds old files all key
/**
 * read new files data
 */
fs.readFile(config.file1.path, 'utf8', function(err, data) {
    newFilesData = JSON.parse(data);
    newFilesKey = Object.keys(newFilesData);
    console.log(config.file1.name + ' read done');
    console.log('Total Key found ' + newFilesKey.length + ' in ' + config.file1.name);
});

/**
 * read old files data
 */
fs.readFile(config.file2.path, 'utf8', function(err, oldData) {
    oldFilesdata = JSON.parse(oldData);
    oldFilesKey = Object.keys(oldFilesdata);
    console.log(config.file2.name + ' read done');
    console.log('Total Key found ' + oldFilesKey.length + ' in ' + config.file2.name);
});

router.get('/getExistingchanges', function(req, res, next) {
    getExistingchanges()
        .then(function(result) {
            res
                .status(200)
                .json({
                    LatestChanges: {
                        length: result.length,
                        data: result
                    }
                });
        });

});

router.get('/getnewaddedchanges', function(req, res, next) {
    getnewaddedchanges()
        .then(function(result) {
            res
                .status(200)
                .json({
                    newaddedchanges: {
                        length: result.length,
                        data: result
                    }
                });
        });
});

/**
 * return the merged files endpoint
 */
router.get('/getmergedFile', function(req, res, next) {
    getmergedFile()
        .then(function(result) {
            var dataTobewritten = JSON.stringify(result); // stringify the object to save in the file
            fs.writeFile('result/result.json', dataTobewritten, function(err) {
                if (err) {
                    res
                        .status(200)
                        .json({ message: err });
                } else {
                    console.log('new merged file created!');
                    res
                        .status(200)
                        .json({ message: "new merged file created!", data: result });
                }
            });
        });
});

/**
 * getting the merged file ready for future use
 */
function getmergedFile() {
    return new Promise((resolve, reject) => {
        let updatedData = null;
        getExistingchanges().then((result) => {
            if (oldFilesKey.length > newFilesKey.length) {
                updatedData = oldFilesdata;
            }
            if (oldFilesKey.length < newFilesKey.length) {
                updatedData = newFilesData;
            }
            // if there are exising data that changed
            if (result && result.length) {
                result.forEach((latestData, index) => {
                    if (updatedData[latestData.key]) {
                        updatedData[latestData.key] = latestData.newValue;
                    }
                });
                console.log('Existing value changes done');
            } else {
                console.log('No existing value changes found');
            }
            // return newly added keys
            getnewaddedchanges().then((result) => {
                if (result && result.length) {
                    result.forEach((res, index) => {
                        updatedData[res.key] = res.value;
                    });
                    console.log('Newly added changes added to list done');
                }
                resolve(updatedData);
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
        newFilesKey.forEach((key, index) => {
            if (oldFilesKey.includes(key)) {
                if (newFilesData[key] != oldFilesdata[key]) {
                    changedValue.push({ key: key, oldValue: oldFilesdata[key], newValue: newFilesData[key] });
                }
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
        var fromValues = [];
        var toValues = [];
        if (newFilesKey.length > oldFilesKey.length) {
            newFilesKey.forEach((key, index) => {
                if (!oldFilesKey.includes(key)) {
                    changedValue.push({ key: key, value: newFilesData[key] });
                }
            });
        }
        if (newFilesKey.length < oldFilesKey.length) {
            oldFilesKey.forEach((key, index) => {
                if (!newFilesKey.includes(key)) {
                    changedValue.push({ key: key, value: oldFilesdata[key] });
                }
            });
        }

        resolve(changedValue);
    });
}

module.exports = router;