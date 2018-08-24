var async = require('async')
var Issue = require('../../utils').issues.Issue

/**
 * subid and sesid mismatch test. Generates error if ses-id and sub-id are different for any file, Takes a file list and return issues
 */
function mismatchTest(BIDS, fileList) {
  var self = BIDS
  var subses_mismatch = false

  // validates if sub/ses-id in filename matches with ses/sub directory file is saved
  async.eachOfLimit(fileList, 200, function(file) {
    var values = getPathandFileValues(file.relativePath)

    var pathValues = values[0]
    var fileValues = values[1]
    // console.log(path, '/n' ,values);

    if (fileValues.sub !== null || fileValues.ses !== null) {
      if (fileValues.sub !== pathValues.sub) {
        // console.log("before call  ",subses_mismatch);
        subses_mismatch = true
        self.issues.push(
          new Issue({
            code: 64,
            evidence:
              'File: ' +
              file.relativePath +
              ' is saved in incorrect subject directory as per sub-id in filename.',
            file: file,
          }),
        )
      }

      if (fileValues.ses !== pathValues.ses) {
        subses_mismatch = true
        self.issues.push(
          new Issue({
            code: 65,
            evidence:
              'File: ' +
              file.relativePath +
              ' is saved in incorrect session directory as per ses-id in filename.',
            file: file,
          }),
        )
      }
    }
  })
  return subses_mismatch
}

/**
 * getPathandFileValues
 * Takes a file path and returns values
 * found following keys for both path and file keys.
 * sub-
 * ses-
 *
 *
 */
function getPathandFileValues(path) {
  var values = {},
    match
  var file_name = {},
    unmat

  // capture subject
  match = /^\/sub-([a-zA-Z0-9]+)/.exec(path)
  values.sub = match && match[1] ? match[1] : null

  // capture session
  match = /^\/sub-[a-zA-Z0-9]+\/ses-([a-zA-Z0-9]+)/.exec(path)
  values.ses = match && match[1] ? match[1] : null

  //capture session and subject id from filename to find if files are in
  // correct sub/ses directory
  var filename = path.replace(/^.*[\\/]/, '')

  // capture sub from file name
  unmat = /^sub-([a-zA-Z0-9]+)/.exec(filename)
  file_name.sub = unmat && unmat[1] ? unmat[1] : null

  // capture session from file name
  unmat = /^sub-[a-zA-Z0-9]+_ses-([a-zA-Z0-9]+)/.exec(filename)
  file_name.ses = unmat && unmat[1] ? unmat[1] : null

  return [values, file_name]
}

module.exports = mismatchTest
