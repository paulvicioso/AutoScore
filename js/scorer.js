var variantsJSONList = [];
var variantsObj = {};

function loadVariantsObject(data) {

    // console.log(data);
    for (var index in data) {
        variantsObj[data[index].target] = data[index].variants;
        // console.log(data[index]['target']);
    }

    // console.log(variantsObj);
}

// return the score for the best fit (Forward or Backward)
function getScore(target, response) {

    target = cleanText(target).trim().toLowerCase();
    response = cleanText(response).trim().toLowerCase();

    var fwMatchedWords = calculateScoreForward(target, response);
    var bwMatchedWords = calculateScoreBackward(target, response);

    var score = (fwMatchedWords.totalMatchedWords > bwMatchedWords.totalMatchedWords) ? fwMatchedWords.totalMatchedWords : bwMatchedWords.totalMatchedWords;

    return score;
}

function validateScoreForSingleMatch(targetPos, targetLen, responsePos, responseLen) {

    if (targetPos == responsePos) {
        // console.log('EQUAL');
        return true;
    }

    if (targetPos > responsePos) {
        if ((targetPos - 1) == responsePos || (targetPos - 2) == responsePos) {
            // console.log('GREATER');
            return true;
        }
    }

    if (targetPos < responsePos) {
        if ((targetPos + 1) == responsePos || (targetPos + 2) == responsePos) {
            // console.log('LOWER');
            return true;
        }
    }

    // console.log('NONE');
    return false;

}


function validateDisplacement(targetPos, responsePos) {

    if (targetPos == responsePos) {
        // console.log('EQUAL');
        return true;
    }

    if (targetPos > responsePos) {
        if ((targetPos - 1) == responsePos) {
            // console.log('GREATER');
            return true;
        }
    }

    if (targetPos < responsePos) {
        if ((targetPos + 1) == responsePos) {
            // console.log('LOWER');
            return true;
        }
    }

    // console.log('NONE');
    return false;

}

// return the matched words for the best fit (Forward or Backward)
function getMatchedWords(target, response) {

    target = cleanText(target).trim().toLowerCase();
    response = cleanText(response).trim().toLowerCase();

    var fwMatchedWords = calculateScoreForward(target, response);
    var bwMatchedWords = calculateScoreBackward(target, response);

    return (fwMatchedWords.totalMatchedWords > bwMatchedWords.totalMatchedWords) ? fwMatchedWords : bwMatchedWords;
}

// this function calculates the score for a given target and response
function calculateScore(targetWords, responseWords) {

    var counter = 0;
    var matchedList = [];
    var matchedWordsObj = {};

    matchedWordsObj.targetCount = targetWords.length;
    matchedWordsObj.responseCount = responseWords.length;

    // fill object with targets words
    for (var tIndex in targetWords) {
        matchedWordsObj[targetWords[tIndex]] = ['$$$$', -1, -1];
    }

    for (var rIndex in responseWords) {
        rWord = responseWords[rIndex];
        // if the target word is in the response we count it
        if (targetWords.includes(rWord)) {
            matchedList.push(rWord);
            matchedWordsObj[rWord] = [rWord, targetWords.indexOf(rWord), Number(rIndex)];
        } else {
            for (tIndex in targetWords) {
                tWord = targetWords[tIndex];

                if (checkPastTense(tWord, rWord) || checkPlurals(tWord, rWord)) {
                    matchedWordsObj[tWord] = [rWord, Number(tIndex), Number(rIndex)];
                    matchedList.push(tWord);
                } else if (variantsObj[tWord] && variantsObj[tWord].length > 0) {
                    if (variantsObj[tWord].includes(rWord)) {
                        // matchedWordsObj[tWord] = rWord;
                        matchedWordsObj[tWord] = [rWord, Number(tIndex), Number(rIndex)];
                        matchedList.push(tWord);
                    } else if (checkPastTense(tWord, rWord) || checkPlurals(tWord, rWord)) {
                        // 
                        matchedWordsObj[tWord] = [rWord, Number(tIndex), Number(rIndex)];
                        matchedList.push(tWord);
                    }
                } else if (variantsObj[rWord] && variantsObj[rWord].length > 0) {
                    if (variantsObj[rWord].includes(tWord)) {
                        // matchedWordsObj[tWord] = rWord;
                        matchedWordsObj[rWord] = [tWord, Number(tIndex), Number(rIndex)];
                        matchedList.push(tWord);
                    } else if (checkPastTense(tWord, rWord) || checkPlurals(tWord, rWord)) {
                        matchedWordsObj[rWord] = [tWord, Number(tIndex), Number(rIndex)];
                        matchedList.push(tWord);
                    }
                }
            }
        }
    }

    // console.log(JSON.stringify(matchedWordsObj));

    // var matchedWordsCounter = 0;

    // for (var tWord in matchedWordsObj) {
    //     if (matchedWordsObj[tWord][0] != '' && validateDisplacement(matchedWordsObj[tWord][1], matchedWordsObj[tWord][2])) {
    //         matchedWordsCounter++;
    //     }
    // }

    var matchedTargetList = [];

    for (tIndex in targetWords) {
        tWord = targetWords[tIndex];
        if (matchedList.includes(tWord)) {
            matchedTargetList.push(tWord);
        }
    }

    matchedWordsObj.totalMatchedWords = matchedTargetList.length;

    // This part is to take into account relative position
    // for (var index in matchedTargetList) {
    //     if (index >= matchedList.indexOf(matchedTargetList[index])) {
    //         counter++;
    //     }
    // }

    // if (counter > 1) {
    //     for (var key in matchedWordsObj) {
    //         if (matchedWordsObj[key][0] != '$$$$') {
    //             dist = Math.abs(parseInt(matchedWordsObj[key][1]) - parseInt(matchedWordsObj[key][2]));
    //             dist2 = Math.abs((matchedWordsObj.targetCount - parseInt(matchedWordsObj[key][1])) - (matchedWordsObj.responseCount - parseInt(matchedWordsObj[key][2])));
    //             if (dist > 1 && dist2 > 1) {
    //                 counter--;
    //             }
    //         }
    //     }
    // }

    // matchedWordsObj.totalMatchedWords = counter;

    // if (matchedWordsCounter != counter) {
    //     console.log('Total Matched Words: ' + matchedWordsCounter);
    //     console.log('Matchs counted: ' + counter);
    //     console.log(matchedTargetList);
    //     console.log(matchedList);
    //     console.log(JSON.stringify(matchedWordsObj));
    // }

    return matchedWordsObj;
}

// This function check if one word is the past tense do the other (...ed)
function checkPastTense(firstWord, secondWord) {

    if (typeof firstWord == 'undefined' || typeof secondWord == 'undefined') {
        return false;
    }

    firstWord = firstWord.trim().toLowerCase();
    secondWord = secondWord.trim().toLowerCase();

    // if (firstWord.length < 4 || secondWord.length < 4) {
    //     return false;
    // }

    if (firstWord == secondWord) {
        return true;
    }

    if (firstWord.endsWith('ed')) {
        // if (firstWord == secondWord + 'd')
        //     return true;
        if (firstWord == secondWord + 'ed')
            return true;
    }

    if (secondWord.endsWith('ed')) {
        // if (secondWord == firstWord + 'd')
        //     return true;
        if (secondWord == firstWord + 'ed')
            return true;
    }

    return false;
}

// This function check if one word is the past tense do the other (...ed)
function checkPlurals(firstWord, secondWord) {

    if (typeof firstWord == 'undefined' || typeof secondWord == 'undefined') {
        return false;
    }

    firstWord = firstWord.trim().toLowerCase();
    secondWord = secondWord.trim().toLowerCase();

    if (firstWord == secondWord) {
        return true;
    }

    if (firstWord.endsWith('s')) {
        if (firstWord == secondWord + 's')
            return true;
        if (firstWord == secondWord + 'es')
            return true;
    }

    if (secondWord.endsWith('s')) {
        if (secondWord == firstWord + 's')
            return true;
        if (secondWord == firstWord + 'es')
            return true;
    }

    return false;
}

// this function calculates the score for a given target and response forward direction
function calculateScoreForward(target, response) {

    var targetWords = target.split(' ');
    var matchedWordsObj = {};

    // if any of the inputs is an empty string the return 0
    if (!response || !target) {

        // fill object with targets words
        for (var tIndex in targetWords) {
            matchedWordsObj[targetWords[tIndex]] = "";
        }

        matchedWordsObj.totalMatchedWords = 0;

        return matchedWordsObj;
    }

    target = target.trim().toLowerCase();
    response = response.trim().toLowerCase();

    // get rid of non alphanumeric characters
    response = response.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");

    // if they are equal return full match
    if (target == response) {

        // fill object with targets words
        for (var tIndex in targetWords) {
            matchedWordsObj[targetWords[tIndex]] = targetWords[tIndex];
        }

        matchedWordsObj.totalMatchedWords = targetWords.length;

        return matchedWordsObj;
    }

    // get the unique words separated
    targetWords = getUniqueElementsFromArray(target.split(" "));
    var responseWords = getUniqueElementsFromArray(response.split(" "));

    return calculateScore(targetWords, responseWords);

}

// this function calculates the score for a given target and response backward
function calculateScoreBackward(target, response) {

    // if any of the inputs is an empty string the return 0
    var targetWords = target.split(' ');
    var matchedWordsObj = {};

    // if any of the inputs is an empty string the return 0
    if (!response || !target) {

        // fill object with targets words
        for (var tIndex in targetWords) {
            matchedWordsObj[targetWords[tIndex]] = "";
        }

        matchedWordsObj.totalMatchedWords = 0;

        return matchedWordsObj;
    }

    target = target.trim().toLowerCase();
    response = response.trim().toLowerCase();

    // get rid of non alphanumeric characters
    response = response.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");

    // if they are equal return full match
    if (target == response) {

        // fill object with targets words
        for (var tIndex in targetWords) {
            matchedWordsObj[targetWords[tIndex]] = targetWords[tIndex];
        }

        matchedWordsObj.totalMatchedWords = targetWords.length;

        return matchedWordsObj;
    }

    // get the unique words separated
    targetWords = getUniqueElementsFromArray(target.split(" "));
    var responseWords = getUniqueElementsFromArray(response.split(" ").reverse()).reverse();

    return calculateScore(targetWords, responseWords);

}