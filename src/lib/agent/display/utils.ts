/**
 * Converts a camelCase string to a sentence format (first letter capitalized, rest in lower case).
 * i.e. sanitizeString("helloWorld")  // returns: 'Hello world'
 */
export function sanitizeString(str: string) {
    const result = str.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replaceAll('_', ' ')
    let words = result.split(' ')
    words = words.map((word, index) => {
        if (index === 0 || word.toUpperCase() === word) {
            return word.charAt(0).toUpperCase() + word.slice(1)
        } else {
            return word.charAt(0).toLowerCase() + word.slice(1)
        }
    })
    return words.join(' ')
}
const urlRegex = new RegExp('^(.*:)//([A-Za-z0-9-.]+)(:[0-9]+)?(.*)$')

export function getHostNameFromUrl(url: string) {
    const parts = urlRegex.exec(url)
    return parts ? parts[2] : undefined
}
