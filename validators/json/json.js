const utils = require('../../utils')
const Ajv = require('ajv')
const ajv = new Ajv({ allErrors: true })
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'))
const Issue = utils.issues.Issue

/**
 * JSON
 *
 * Takes a JSON file as a string and a callback
 * as arguments. And callsback with any errors
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function(file, jsonContentsDict, callback) {
  // primary flow --------------------------------------------------------------------

  let issues = []
  const potentialSidecars = utils.files.potentialLocations(file.relativePath)
  const mergedDictionary = utils.files.generateMergedSidecarDict(
    potentialSidecars,
    jsonContentsDict,
  )
  if (mergedDictionary) {
    issues = issues.concat(checkUnits(file, mergedDictionary))
    issues = issues.concat(compareSidecarProperties(file, mergedDictionary))
  }
  callback(issues, mergedDictionary)
}

// individual checks ---------------------------------------------------------------

function checkUnits(file, sidecar) {
  let issues = []
  const schema = selectSchema(file)
  issues = issues.concat(validateSchema(file, sidecar, schema))

  issues = issues.concat(
    checkSidecarUnits(file, sidecar, { field: 'RepetitionTime', min: 100 }, 2),
  )

  issues = issues.concat(
    checkSidecarUnits(file, sidecar, { field: 'EchoTime', min: 1 }, 3),
  )
  issues = issues.concat(
    checkSidecarUnits(file, sidecar, { field: 'EchoTime1', min: 1 }, 4),
  )
  issues = issues.concat(
    checkSidecarUnits(file, sidecar, { field: 'EchoTime2', min: 1 }, 4),
  )
  issues = issues.concat(
    checkSidecarUnits(file, sidecar, { field: 'TotalReadoutTime', min: 10 }, 5),
  )

  return issues
}

const compareSidecarProperties = (file, sidecar) => {
  const issues = []

  // check that EffectiveEchoSpacing < TotalReadoutTime
  if (
    sidecar.hasOwnProperty('TotalReadoutTime') &&
    sidecar.hasOwnProperty('EffectiveEchoSpacing') &&
    sidecar['TotalReadoutTime'] < sidecar['EffectiveEchoSpacing']
  ) {
    issues.push(
      new Issue({
        file: file,
        code: 93,
      }),
    )
  }
  return issues
}

const selectSchema = file => {
  let schema = null
  if (file.name) {
    if (file.name.endsWith('participants.json')) {
      schema = require('./schemas/data_dictionary.json')
    } else if (
      file.name.endsWith('bold.json') ||
      file.name.endsWith('sbref.json')
    ) {
      schema = require('./schemas/bold.json')
    } else if (file.relativePath === '/dataset_description.json') {
      schema = require('./schemas/dataset_description.json')
    } else if (file.name.endsWith('meg.json')) {
      schema = require('./schemas/meg.json')
    } else if (file.name.endsWith('ieeg.json')) {
      schema = require('./schemas/ieeg.json')
    } else if (
      file.relativePath.includes('/meg/') &&
      file.name.endsWith('coordsystem.json')
    ) {
      schema = require('./schemas/coordsystem_meg.json')
    } else if (
      file.relativePath.includes('/ieeg/') &&
      file.name.endsWith('coordsystem.json')
    ) {
      schema = require('./schemas/coordsystem_ieeg.json')
    } else if (file.name.endsWith('eeg.json')) {
      schema = require('./schemas/eeg.json')
    }
  }
  return schema
}

const validateSchema = (file, sidecar, schema) => {
  const issues = []
  if (schema) {
    const validate = ajv.compile(schema)
    const valid = validate(sidecar)
    if (!valid) {
      validate.errors.map(error =>
        issues.push(
          new Issue({
            file: file,
            code: 55,
            evidence: error.dataPath + ' ' + error.message,
          }),
        ),
      )
    }
  }
  return issues
}

const checkSidecarUnits = (file, sidecar, fieldObj, errCode) => {
  const issues = []
  const field = fieldObj.field
  const min = fieldObj.min
  if (sidecar.hasOwnProperty(field) && sidecar[field] > min) {
    issues.push(
      new Issue({
        code: errCode,
        file: file,
      }),
    )
  }
  return issues
}
