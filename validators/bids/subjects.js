const utils = require('../../utils')
const Issue = utils.issues.Issue

const participantsInSubjects = (participants, subjects) => {
  let issues = []
  if (participants) {
    const participantsFromFile = participants.list.sort()
    const participantsFromFolders = subjects.sort()
    if (
      !utils.array.equals(participantsFromFolders, participantsFromFile, true)
    ) {
      issues.push(
        new Issue({
          code: 49,
          evidence:
            'participants.tsv: ' +
            participantsFromFile.join(', ') +
            ' folder structure: ' +
            participantsFromFolders.join(', '),
          file: participants.file,
        }),
      )
    }
  }
  return issues
}

const atLeastOneSubject = fileList => {
  let issues = []
  const fileKeys = Object.keys(fileList)
  const hasSubjectDir = fileKeys.some(key => {
    const file = fileList[key]
    return file.relativePath && file.relativePath.startsWith('/sub-')
  })
  if (!hasSubjectDir) {
    issues.push(new Issue({ code: 45 }))
  }
  return issues
}

const collectSubjects = (fileList, options) => {
  let subjects = []
  const fileKeys = Object.keys(fileList)
  fileKeys.forEach(key => {
    const file = fileList[key]
    if (
      !utils.type.file.isStimuliData(file.relativePath) &&
      utils.type.isBIDS(file.relativePath, options.bep006, options.bep010)
    ) {
      const pathValues = utils.type.getPathValues(file.relativePath)
      const isEmptyRoom = pathValues.sub && pathValues.sub == 'emptyroom'

      if (
        pathValues.sub &&
        subjects.indexOf(pathValues.sub) === -1 &&
        !isEmptyRoom
      ) {
        subjects.push(pathValues.sub)
      }
    }
  })
  return subjects
}

module.exports = {
  participantsInSubjects,
  atLeastOneSubject,
  collectSubjects,
}