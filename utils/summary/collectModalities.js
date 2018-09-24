const type = require('../type')

const collectModalities = fileList => {
  let modalities = []
  const keys = Object.keys(fileList)
  keys.forEach(key => {
    const file = fileList[key]
    const path = file.relativePath
    const pathParts = path.split('_')
    const suffix = pathParts[pathParts.length - 1]

    // check modality by data file extension ...
    // and capture data files for later sanity checks (when available)
    if (type.file.isModality(file.name)) {
      // collect modality summary
      const modality = suffix.slice(0, suffix.indexOf('.'))
      if (modalities.indexOf(modality) === -1) {
        modalities.push(modality)
      }
    }
  })
  return modalities
}

module.exports = collectModalities
