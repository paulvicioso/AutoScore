
var sessionInfo;

// returns only unique elements of the given array
function getUniqueElementsFromArray(arr) {
    return arr.filter(function (elem, pos) {
        return arr.indexOf(elem) == pos;
    });
}

// Get the given param from the URL
function getQueryParam(key) {
    var vars = [],
        hash;
    var q = document.URL.split('?')[1];
    if (q != undefined) {
        q = q.split('&');
        for (var i = 0; i < q.length; i++) {
            hash = q[i].split('=');
            vars.push(hash[1]);
            vars[hash[0]] = hash[1];
        }
    }

    if (typeof (vars[key]) == "undefined")
        return "";
    else
        return vars[key];
}

// returns a string without repeated characters (letters)
function deleteRepeatedChars(str) {
    return str.split("").filter(function (elem, pos, s) {
        return s.indexOf(elem) == pos;
    }).join("");
}

// returns a string with no dots or commas (. or ,)
function cleanText(text) {
    return text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
}

// This function eliminates commas inside double quotes
function deleteCommasInDoubleQuotes(str) {
    // get rid of commas inside double quotes
    var result = str.replace(/"[^"]+"/g, function (match) {
        return match.replace(/,/g, '');
    });

    return result;
}

function compArrays(arr1, arr2) {
    // if the other arr1 is a falsy value, return
    if (!arr1 || !arr2)
        return false;

    // compare lengths - can save a lot of time 
    if (arr2.length != arr1.length)
        return false;

    for (var i = 0, l = arr2.length; i < l; i++) {
        // Check if we have nested arr1s
        if (arr2[i] instanceof Array && arr1[i] instanceof Array) {
            // recurse into the nested arr1s
            if (!arr2[i].equals(arr1[i]))
                return false;
        } else if (arr2[i] != arr1[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }

    return true;
}

function difference(arr1, arr2) {

    var a1 = flatten(arr1, true);
    var a2 = flatten(arr2, true);

    var a = [],
        diff = [];

    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = false;
    }

    for (i = 0; i < a2.length; i++) {
        if (a[a2[i]] === false) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }

    for (var k in a) {
        diff.push(k);
    }

    return diff;
}

var flatten = function (a, shallow, r) {

    if (!r) {
        r = [];
    }

    if (shallow) {
        return r.concat.apply(r, a);
    }

    for (i = 0; i < a.length; i++) {
        if (a[i].constructor == Array) {
            flatten(a[i], shallow, r);
        } else {
            r.push(a[i]);
        }
    }

    return r;
};

function isEmail(email) {

    return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test(email);
}

function readCookie() {
    var cookiesObj = {};
    var allcookies = document.cookie;
    // console.log ("All Cookies : " + allcookies );

    // Get all the cookies pairs in an array
    var cookiearray = allcookies.split(';');

    // Now take key value pair out of this array
    for (var i = 0; i < cookiearray.length; i++) {
        name = cookiearray[i].split('=')[0];
        value = cookiearray[i].split('=')[1];
        // console.log ("Key is : " + name.trim() + " and Value is : " + value.trim());
        cookiesObj[name.trim()] = value.trim();
    }

    // console.log(cookiesObj);
    return cookiesObj;
}