

export function extractUriFromStr(input) {
    let pattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gm
    let regex = new RegExp(pattern);
    let result = input.match(regex);
    return result;
  }